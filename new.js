const config = require('./config.js')
const { program } = require('commander')
const commander = require('commander')
const chalk = require('chalk')
const clear = require('clear')
const prompt = require('prompt')
const open = require('open')
const striptags = require('striptags')
const NewsAPI = require('newsapi')
const newsapi = new NewsAPI(config.id)

const main = async () => {
  try {
    program.version('1.0.0')

    // Language
    const isLanguageOk = (language) => {
      return language
    }
    const langs = ['ar', 'de', 'en', 'es', 'fr', 'he', 'it', 'nl', 'no', 'pt', 'ru', 'se', 'ud', 'zh']
    const langOption = new commander.Option('-l, --language <language>', 'Language')
    langOption.default('en')
    langOption.choices(langs)
    langOption.argParser(isLanguageOk)
    program.addOption(langOption.choices(langs))

    program.parse(process.argv)
    const options = program.opts()

    // Keyword
    const isKeywordOk = (keyword) => {
      return keyword
    }
    let keywordArg
    keywordArg = new commander.Argument('[keyword]', 'keyword')
    keywordArg.default('headlines')
    keywordArg.argParser(isKeywordOk)
    program.addArgument(keywordArg)

    program.action(async (keyword) => {

      // Fetch News
      let language = options.language
      let response = {}
      if (keyword === 'headlines') {
        response = await newsapi.v2.topHeadlines({ language: language })
      } else {
        let date = new Date()
        let start = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
        response = await newsapi.v2.everything({
          q: keyword,
          language: language,
          from: start
        })
      }

      // Display List
      const entries = []
      let index = 0
      if (response.status === 'ok') {
        clear()
        console.log()
        console.log(chalk.cyan.bold(`_ __   _____      _____ `))
        console.log(chalk.cyan.bold(`| '_ \\ / _ \\ \\ /\\ / / __|`))
        console.log(chalk.cyan.bold(`| | | |  __/\\ V  V /\\__ \\`))
        console.log(chalk.cyan.bold(`|_| |_|\\___| \\_/\\_/ |___/`))
        console.log()

        for (let article of response.articles) {
          process.stdout.write(`${chalk.cyan.bold(index)} ${chalk.green.bold(article.title)}  `)

          let date = new Date(article.publishedAt)
          let year = date.getFullYear()
          let month = date.getMonth() + 1
          let day = date.getDate()
          let publishedAt = `${year}/${month}/${day}`

          process.stdout.write(chalk.grey.bold(`[${publishedAt}]`))
          process.stdout.write('\r\n')
          entries.push({
            title: article.title,
            description: article.description,
            url: article.url
          })
          index++
        }
      }

      // Prompt Choice
      const promptAndOpenNews = async () => {
        const selectIndex = async () => {
          const schema = {
            properties: {
              select: {
                description: 'Which news do you want to display? ',
                type: 'integer',
                required: true
              }
            }
          }
          return Number((await prompt.get(schema)).select)
        }
        let selected = 0
        while (true) {
          console.log()
          let chocie = await selectIndex()
          if (chocie >= 0 && chocie <= index) {
            selected = chocie
            break;
          }
        }

        // Display Description
        let description = striptags(entries[selected].description)
        description = description.replace(" ", "")
        console.log()
        if (description.length === 0) {
          console.log(chalk.green.bold('No Description'))
        } else {
          console.log(chalk.green.bold(description))
        }
        await open(entries[selected].url)
      }

      while (true) {
        prompt.start()
        await promptAndOpenNews()
      }
    })

    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red.bold(error.message))
  }
}

main()