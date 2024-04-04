import Console from "../console.js"
import ConsoleData from "./consoleData.js"

export default class ConsoleApp extends FormApplication {

    constructor(getDocument, getUser) {
        super()
        this._document = getDocument
        this._represents = getUser
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            closeOnSubmit: false,
            id: `${Console.ID}`,
            popOut: true,
            maximizable: true,
            minimizable: true,
            resizable: true,
        }
        return foundry.utils.mergeObject(defaults, overrides)
    }

    getData() {
        const console = ConsoleData.getConsoles().find((obj) => obj.id === this.options.id)
        let data = {
            ...console
        }

        data.character = this.getName("$user")
        this.getTemplate(data)
        this.options.title = data.content.title

        return data
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons()
        if (game.user.isGM) {
            buttons.unshift({
                label: "Show Players",
                class: "share-image",
                icon: "fas fa-eye",
                onclick: () => this.shareApp()
            })
        }
        return buttons
    }

    getName(str) {
        let name = ""
        if (game.user.isGM) {
            name = game.user.character ? `${game.user.character.name}` : str
        } else {
            name = game.user.character ? `${game.user.character.name}` : `${game.user.name}`
        }
        return name
    }

    getTemplate(data) {
        const GM = game.user.isGM
        let template = ""
        if (data.styling.messengerStyle) {
            template = GM ? Console.TEMPLATES.APP_IM : Console.TEMPLATES.APP_IM_PLAYER
        } else {
            template = GM ? Console.TEMPLATES.APP_TERM : Console.TEMPLATES.APP_TERM_PLAYER
        }
        return this.options.template = template
    }

    getWindowDetails(data) {
        const options = {
            height: data.styling.height,
            template: this.getTemplate(data),
            title: data.content.title,
            width: data.styling.width
        }
        return this.options = foundry.utils.mergeObject(this.options, options)
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.on('click', "[data-action]", this._handleButtonClick)
    }

    async close(...args) {
        delete this._document.apps[this.appId]
        delete this._represents.apps[this.appId]
        return super.close(...args)
    }

    _handleButtonClick = (event) => {
        const clickedElement = $(event.currentTarget)
        const action = clickedElement.data().action
        const id = clickedElement.data().consoleId
        const index = clickedElement.data().messageIndex

        switch (action) {
            case 'delete-message':
                const newData = ConsoleData.getConsoles().find((obj) => obj.id === id)
                newData.content.body.splice(index, 1)
                ConsoleData.updateConsole(newData.id, newData)
                break;
            default:
                ui.notifications.error('Console | ConsoleApp has encountered and invalid button data action in _handleButtonClick')
        }
    }

    render(...args) {
        this._document.apps[this.appId] = this
        if (this._represents) {
            this._represents.apps[this.appId] = this
        }
        return super.render(...args)
    }

    shareApp() {
        game.socket.emit('module.console', {
            id: this.options.id
        })
    }

    static _handleShareApp(id) {
        const data = ConsoleData.getConsoles().find((obj) => obj.id === id.id)
        const console = new ConsoleApp(ConsoleData.getDataPool(), game.user)
        return console.render(true, { "id": data.id, "height": data.styling.height, "width": data.styling.width })
    }

    _updateObject(event, formData) {
        const console = this.getData()
        const messageLog = [...console.content.body]
        const name = this.getName("")
        const message = {
            "text": formData.consoleInputText,
            "username": name
        }
        messageLog.push(message)
        console.content.body = messageLog
        ConsoleData.updateConsole(console.id, console)
    }
}

