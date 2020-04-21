import { Classes, ConstEntry } from '../data'


export default class ClsProvider {
  private PRIORITY = 6
  private MIN_LEN = 2

  constructor() {
    
  }

  getSuggestions(/*options*/) {
    // const { prefix } = options
    // if (prefix.length >= this.MIN_LEN)
    //   return this.match(prefix).map(e => this.format(e))
	}

  match(prefix: string): ConstEntry[] {
    prefix = prefix.toLowerCase()
    return Classes.filter(e => e.id.toLowerCase().startsWith(prefix))
  }

  format = (entry: ConstEntry) => ({
    // text: entry.id,
    // description: entry.desc,
    // type: 'class'
  })
}
