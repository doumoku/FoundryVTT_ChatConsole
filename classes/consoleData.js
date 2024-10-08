import Console from "../console.js"

export default class ConsoleData {

    static name = "_console-data"

    static ID = "Rk3WTT9Rvm0smJKg"

    static createDataPool() {
        if (game.user.isGM) {
            JournalEntry.create({
                "name": this.name,
                "ownership": {
                    "default": 3
                }
            })
        } else {
            ui.notifications.error(`Console | No data storage Document of name '${this.name}' exists and you lack the permissions to create one. Consult your GM.`)
        }
    }

    static getDataPool() {
        // return {Object}
        const dataPool = game.journal.getName(this.name)
        if (dataPool) {
            if (!dataPool.flags.console?.consoles) {
                dataPool.setFlag(Console.ID, Console.FLAGS.CONSOLE, {})
            }
            return dataPool
        } else {
            this.createDataPool()
            ui.notifications.notify(`Console | Created JournalEntry '${this.name}' to store module data`)
        }
    }

    static getConsoles() {
        // return {Array} 
        const data = this.getDataPool()
        let arr = []
        if (data?.flags?.console?.consoles) {
            Array.from(Object.entries(data.flags.console.consoles)).forEach((entry) => {
                arr.push(entry[1])
            })
        }
        return arr
    }

    static async createJournalPage(console) {
        const data = this.getDataPool()
        const newEntry = new JournalEntryPage({ "name": console.name })
        await data.createEmbeddedDocuments(newEntry.constructor.name, [newEntry])
    }

    static async createConsole() {
        if (game.user.isGM) {
            const title = Console.getRename("", "new console")
            const defaultConfig = game.settings.get(Console.ID, 'defaultConfig')
            const validDefault = Object.keys(defaultConfig).length > 0

            let newConsole = {}
            if (validDefault) {
                defaultConfig.id = foundry.utils.randomID(Console.IDLENGTH)
                newConsole = defaultConfig
            } else {
                newConsole = {
                    content: {
                        body: [],
                        title: title,
                    },
                    description: "Description",
                    gmInfo: "GM info",
                    id: foundry.utils.randomID(Console.IDLENGTH),
                    name: title,
                    limits: {
                        hardLimit: 2048, // inbuilt character limit so you can't just send the entire bee movie script
                        marker: '...',
                        type: 'none', // options are 'words', 'characters' and 'none'.
                        value: 0
                    },
                    locked: false,
                    playerOwnership: [],
                    public: false,
                    scenes: [],
                    sceneNames: [],
                    styling: {
                        bg: '#000000',
                        bgImg: "",
                        fg: '#ffffff',
                        height: 880,
                        messengerStyle: true,
                        width: 850
                    }
                }
            }

            const data = this.getDataPool()
            const newConsoles = {
                [newConsole.id]: newConsole
            }
            data.setFlag(Console.ID, Console.FLAGS.CONSOLE, newConsoles)
        }
    }

    static async deleteConsole(id) {
        // @param {string} id
        if (game.user.isGM) {
            const data = this.getDataPool()
            const idDeletion = {
                [`-=${id}`]: null
            }
            data.setFlag(Console.ID, Console.FLAGS.CONSOLE, idDeletion)
        }
    }

    static async duplicateConsole(id) {
        // @param {string} id
        const consoleToCopy = this.getConsoles().find((obj) => obj.id === id)
        const clonedConsole = structuredClone(consoleToCopy)
        clonedConsole.id = foundry.utils.randomID(16)
        clonedConsole.name = `${consoleToCopy.name} (copy)`
        const newConsoles = {
            [clonedConsole.id]: clonedConsole
        }
        this.getDataPool().setFlag(Console.ID, Console.FLAGS.CONSOLE, newConsoles)
    }

    static async toggleLock(id) {
        const console = this.getConsoles().find((obj) => obj.id === id)
        console.locked = console.locked ? false : true
        const update = {
            [id]: console
        }
        this.getDataPool().setFlag(Console.ID, Console.FLAGS.CONSOLE, update)
    }

    static async toggleVisibility(id) {
        // @param {string} id
        const consoleToCopy = this.getConsoles().find((obj) => obj.id === id)
        consoleToCopy.public = consoleToCopy.public ? false : true
        const update = {
            [id]: consoleToCopy
        }
        this.getDataPool().setFlag(Console.ID, Console.FLAGS.CONSOLE, update)
    }

    static async updateConsole(id, updateData) {
        // @param {string} id
        // @param {object} updateData
        const data = this.getDataPool()
        const update = {
            [id]: updateData
        }
        data.setFlag(Console.ID, Console.FLAGS.CONSOLE, update)
    }

    static async updateJournalPage(console) {
        // @param {object} console
        let html = `
            <div style="background-color:${console.styling.bg};
            border:2px solid ${console.styling.fg};
            color:${console.styling.fg};
            padding: 5px">
            <p style="background-color:${console.styling.fg};color:${console.styling.bg}"><strong>${console.content.title}</strong></p>`

        if (console.content.body.length > 0) {
            console.content.body.forEach((message) => {
                if (message.user.name.length === 0) {
                    html += `<p>${message.text}`
                } else {
                    html += `<p><strong>${message.user.name}</strong>: ${message.text}</p>`
                }
            })
        }
        html += `</div>`

        const doc = ConsoleData.getDataPool().pages._source.find((obj) => obj.name === console.name)
        const data = ConsoleData.getDataPool()
        await data.updateEmbeddedDocuments('JournalEntryPage', [{
            _id: doc._id,
            flags: {
                [Console.ID]: {
                    [Console.FLAGS.CONSOLE]: console
                }
            },
            sort: data._source.pages.length > 0 ? data._source.pages[data._source.pages.length - 1].sort + 100000 : 0,
            text: {
                content: html,
                format: 1,
                markdown: ""
            },
        }])


    }
}

globalThis.ConsoleData = ConsoleData

