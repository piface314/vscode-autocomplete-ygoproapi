import { Constants, ConstEntry } from '../data'
import Config from '../config'


export default class ConstProvider {
  private PRIORITY = 3
  private MIN_LEN = 3

  constructor() {

  }

  getSuggestions(/*options*/) {
    // const { prefix } = options
    // if (prefix.length >= this.MIN_LEN)
    //   return this.match(prefix).map(e => this.format(e))
  }

  match(prefix: string): ConstEntry[] {
    const matchCase = Config.get("matchCaseForConstants")
    const getID = matchCase ? (e: ConstEntry) => e.id : (e: ConstEntry) => e.id.toLowerCase()
    if (!matchCase)
      prefix = prefix.toLowerCase()
    const starts: ConstEntry[] = [], includes: ConstEntry[] = []
    Constants.forEach((e) => {
      const id = getID(e)
      if (id.startsWith(prefix))
        starts.push(e)
      else if (id.includes(prefix))
        includes.push(e)
    })
    return starts.concat(includes)
  }

  format = (entry: ConstEntry) => ({
    // text: entry.id,
    // description: entry.desc,
    // rightLabel: `= ${entry.value}`,
    // type: 'constant'
  })
}
