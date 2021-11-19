'use strict';

class State {
    static historyNavigationReloadDelayMs = 4

    static serializeStateAndSettings(){
        let wrapper = {
            'spheres' : Sphere.spheres,
            'settings' : Settings,
            'zoom' : Utility.zoom,
        }
        return JSON.stringify(wrapper)
    }
    static deserializeStateAndSettings(serializedWrapper){

        let wrapper = JSON.parse(serializedWrapper)
        
        let deserializedSpheres = wrapper.spheres
        let deserializedSettings = wrapper.settings
        let deserializedZoom = wrapper.zoom

        Utility.zoom = deserializedZoom

        let allIDs = Object.keys(deserializedSpheres)
        
        for (let id of allIDs){

            let deserializedSphere = deserializedSpheres[id]

            let newSphere = new Sphere(
                deserializedSphere.x,
                deserializedSphere.y,
                deserializedSphere._mass,
                deserializedSphere._density
            )

            newSphere.vx = deserializedSphere.vx
            newSphere.vy = deserializedSphere.vy

            newSphere.polarColor = deserializedSphere.polarColor
            newSphere.equatorColor = deserializedSphere.equatorColor
            newSphere.atmosphereColor = deserializedSphere.atmosphereColor
        }
    }
    static saveStateAndSettingsToHash(){
        location.hash = encodeURIComponent(
            this.serializeStateAndSettings()
        )
    }
    static loadStateAndSettingsFromHash(){

        let decodedURI = decodeURIComponent(location.hash)

        if (decodedURI != ''){
            this.deserializeStateAndSettings(
                decodedURI[0] == '#' ? (decodedURI.slice(1)) : decodedURI
            )
        }
    }
    static reloadCurrent(){
        setTimeout(() => {
            Sphere.immediatleyDeleteAllSpheres()
            State.loadStateAndSettingsFromHash()
        }, State.historyNavigationReloadDelayMs);
    }
    static goBackInHistory(event){
        if ( !( (location.hash == '') || (location.hash == '#') ) ){
            history.back()
            setTimeout(() => {
                Sphere.immediatleyDeleteAllSpheres()
                State.loadStateAndSettingsFromHash()
            }, State.historyNavigationReloadDelayMs);
        }
    }
    static goForwardInHistory(event){
        history.forward()
        setTimeout(() => {
            Sphere.immediatleyDeleteAllSpheres()
            State.loadStateAndSettingsFromHash()
        }, State.historyNavigationReloadDelayMs);
    }
    static clearState(event){
        location.hash = ''
        setTimeout(() => {
            Sphere.immediatleyDeleteAllSpheres()
            State.loadStateAndSettingsFromHash()
        }, State.historyNavigationReloadDelayMs);
    }
}

class Settings {
    static continuousPropertyExponentialScalingRate = 1.05
    static moveViewSpeed = 50;
    static zoomViewSpeed = 1.02;
    static timeSpeedFactor = 1
    static newMassFactor = 1
    static toolModes = [
        'linear',
        'orbit',
    ]
    static _toolMode = 'linear'
    static get toolMode(){
        return this._toolMode
    }
    static set toolMode(newMode){
        if ( !this.toolModes.includes(newMode) ){
            console.error(`Tool mode ${newMode} is not valid. The valid tool modes are ${this.toolModes.toString()}`)
        }
        this._toolMode = newMode
    }

    static valueBoxNiceNumericalFormatting(number){
        return Utility.formatNumberInScientificNotation(number, 2)
    }

    static updateContinuousPropertyValuesBasedOnInputBooleans(){

        // call this every frame, or every x frame, to give the appearance of button presses
        // continuously changing the value of the parameter

        if (Input.changeMassBooleans.up){
            this.newMassFactor *= this.continuousPropertyExponentialScalingRate
            Input.changeMassBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.newMassFactor)
        }
        else if (Input.changeMassBooleans.down){
            this.newMassFactor /= this.continuousPropertyExponentialScalingRate
            Input.changeMassBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.newMassFactor)
        } 

        if (Input.changeTimeBooleans.up){
            this.timeSpeedFactor *= this.continuousPropertyExponentialScalingRate
            Input.changeTimeBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.timeSpeedFactor)
        }
        else if (Input.changeTimeBooleans.down){
            this.timeSpeedFactor /= this.continuousPropertyExponentialScalingRate
            Input.changeTimeBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.timeSpeedFactor)
        } 
        
        if (Input.changeZoomBooleans.in){
            Utility.zoomIn(1 / Settings.zoomViewSpeed)
        }
        else if (Input.changeZoomBooleans.out){
            Utility.zoomIn(Settings.zoomViewSpeed)
        }
    }
    static updateAllContinuousPropertyValues(){
        Input.changeMassBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.newMassFactor)
        Input.changeTimeBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(this.timeSpeedFactor)
    }
}

class EventHandlerForMouseDownAndUp {
    elementBoundTo
    procedureToCallOnMouseDown
    procedureToCallOnMouseUp
    automaticallyHighlightWhenPressed
    constructor(elementToRegisterEventOn, procedureToCallOnMouseDown, procedureToCallOnMouseUp, automaticallyHighlightWhenPressed = true){
        this.elementBoundTo = elementToRegisterEventOn
        this.procedureToCallOnMouseDown = procedureToCallOnMouseDown
        this.procedureToCallOnMouseUp = procedureToCallOnMouseUp
        this.automaticallyHighlightWhenPressed = automaticallyHighlightWhenPressed

        let self = this

        this.elementBoundTo.addEventListener('mousedown', 
            function(event){
                self.procedureToCallOnMouseDown(event)
                if (self.automaticallyHighlightWhenPressed){
                    self.elementBoundTo.classList.add('active')
                }
                
            }
        )
        this.elementBoundTo.addEventListener('mouseup', 
            function(event){
                self.procedureToCallOnMouseUp(event)
                if (self.automaticallyHighlightWhenPressed){
                    self.elementBoundTo.classList.remove('active')
                }
            }
        )
        Input.eventhandlerClassInstances.push(this)
    }
}
class EventHandlerForMouseUpToggle {
    elementBoundTo
    procedureToCallOnMouseDown
    procedureToCallOnMouseUp
    isToggledOn = false
    constructor(elementToRegisterEventOn, procedureToCallOnMouseUp, startOn = false){
        this.elementBoundTo = elementToRegisterEventOn
        this.procedureToCallOnMouseUp = procedureToCallOnMouseUp

        if (startOn == true){
            this.isToggledOn = true
        }

        let self = this

        this.elementBoundTo.addEventListener('mouseup', 
            function(event){
                self.procedureToCallOnMouseUp(event)
                if (self.isToggledOn){
                    self.elementBoundTo.classList.remove('active')
                    self.isToggledOn = !self.isToggledOn
                }
                else{
                    self.elementBoundTo.classList.add('active')
                    self.isToggledOn = !self.isToggledOn
                }
            }
        )
        Input.eventhandlerClassInstances.push(this)
    }
}

class EventHandlerForKeyDownAndUp {
    elementBoundTo
    keyString
    procedureToCallOnMouseDown
    procedureToCallOnMouseUp
    constructor(keyString, procedureToCallOnMouseDown, procedureToCallOnMouseUp){
        this.elementBoundTo = document
        this.keyString = keyString
        this.procedureToCallOnMouseDown = procedureToCallOnMouseDown
        this.procedureToCallOnMouseUp = procedureToCallOnMouseUp

        let self = this
        
        this.elementBoundTo.addEventListener('keydown', 
            function(event){
                if (event.key == keyString){
                    self.procedureToCallOnMouseDown()
                }
            }
        )
        this.elementBoundTo.addEventListener('keyup', 
            function(event){
                if (event.key == keyString){
                    self.procedureToCallOnMouseUp()
                }
            }
        )
        this.elementBoundTo.addEventListener('keyup', procedureToCallOnMouseUp)
        Input.eventhandlerClassInstances.push(this)
    }
}

class Input {
    static mousex
    static mousey
    static mousexAtStartOfAim
    static mouseyAtStartOfAim
    static toolIsAiming = false // if true, indicates that user is holding mouse down and is aiming the tool's momentum vector / position
    static eventhandlerClassInstances = []
    static moveViewBooleans = {
        up : false,
        down : false,
        right : false,
        left : false,
    }
    static showEffectToggleBooleans = {
        forceVectors : false,
        velocityVectors : false,
        tracesEffect : false,
        areaEffect : false,
    }
    static changeZoomBooleans = {
        in : false,
        out : false,
        valueBoxElement : setTimeout(() => {
            Input.changeZoomBooleans.valueBoxElement = document.querySelector('body.spacesimulator div.singleinputcontainer div.inputbox.valuebox#zoomvalue')
        }, 100)
    }
    static changeMassBooleans = {
        up : false,
        down : false,
        valueBoxElement : setTimeout(() => {
            Input.changeMassBooleans.valueBoxElement = document.querySelector('body.spacesimulator div.singleinputcontainer div.inputbox.valuebox#massvalue')
        }, 100)
    }
    static changeTimeBooleans = {
        up : false,
        down : false,
        valueBoxElement : setTimeout(() => {
            Input.changeTimeBooleans.valueBoxElement = document.querySelector('body.spacesimulator div.singleinputcontainer div.inputbox.valuebox#timevalue')
        }, 100)
    }
    static handleMouseDownOnViewIntoCanvas(event){
        Input.toolIsAiming = true
        Input.mousexAtStartOfAim = Input.mousex
        Input.mouseyAtStartOfAim = Input.mousey
    }
    static handleMouseUpOnViewIntoCanvas(event){
        this.toolIsAiming = false

        if (Sphere.totalMass > 0){
            // only the linear tool is valid for adding the first sphere because other modes
            // require there to be existing spheres
            switch (Settings.toolMode) {
                case 'linear':
                    Tools.linearToolMouseUp()
                    break;
                case 'orbit':
                    Tools.orbitToolMouseUp()
                    break;
                default:
                    break;
            }
        }
        else{
            Tools.linearToolMouseUp()
        }

        State.saveStateAndSettingsToHash()
    }
    static registerEventsAfterPageLoad(){

        new EventHandlerForMouseDownAndUp(
            document.querySelector('div#divwhichdoesnotobstructviewtocanvas'),
            Input.handleMouseDownOnViewIntoCanvas,
            Input.handleMouseUpOnViewIntoCanvas
        )
        for (let direction of 'left right up down'.split(' ')){
            let directionFirstLetterCapitalized = direction[0].toUpperCase() + direction.slice(1)
            new EventHandlerForMouseDownAndUp(
                document.querySelector(`div.inputbox#move${direction}`),
                function(){
                    Input.moveViewBooleans[direction] = true
                },
                function(){
                    Input.moveViewBooleans[direction] = false
                },
            )
            new EventHandlerForKeyDownAndUp(
                `Arrow${directionFirstLetterCapitalized}`,
                function(){
                    Input.moveViewBooleans[direction] = true
                },
                function(){
                    Input.moveViewBooleans[direction] = false
                },
            )
        }
        for (let vectorProperty of 'Force Velocity'.split(' ')){
            let vectorPropertyAllLowercase = vectorProperty.toLowerCase()

            let showVectorPropertyToggleFunction = function(){
                Input.showEffectToggleBooleans[`${vectorPropertyAllLowercase}Vectors`] = !( Input.showEffectToggleBooleans[`${vectorPropertyAllLowercase}Vectors`] )
            }

            new EventHandlerForMouseUpToggle(
                document.querySelector(`div.inputbox#showvector${vectorPropertyAllLowercase}`),
                showVectorPropertyToggleFunction
            )
        }
        for (let showProperty of 'Traces Area'.split(' ')){
            let showPropertyAllLowercase = showProperty.toLowerCase()

            let showEffectPropertyToggleFunction = function(){
                Sphere.clearAllSpherePathTraces()
                Input.showEffectToggleBooleans[`${showPropertyAllLowercase}Effect`] = !( Input.showEffectToggleBooleans[`${showPropertyAllLowercase}Effect`] )
            }

            new EventHandlerForMouseUpToggle(
                document.querySelector(`div.inputbox#show${showPropertyAllLowercase}`),
                showEffectPropertyToggleFunction
            )
        }
        for (let toolMode of 'Linear Orbit'.split(' ')){
            let toolModeAllLowercase = toolMode.toLowerCase()

            let markAllToolModesAsDedelected = function(){
                let buttons = document.querySelectorAll('div.inputbox.toolmodeoption')
                for (let button of buttons){
                    button.classList.remove('active')
                }
            }

            let setToolMode = function(){
                markAllToolModesAsDedelected()
                document.querySelector(`div.inputbox#tool${toolModeAllLowercase}`).classList.add('active')
                Settings.toolMode = toolModeAllLowercase
            }

            

            new EventHandlerForMouseDownAndUp(
                document.querySelector(`div.inputbox#tool${toolModeAllLowercase}`),
                setToolMode,
                function(){},
                false
            )
        }
        for (let direction of 'up down'.split(' ')){
            new EventHandlerForMouseDownAndUp(
                document.querySelector(`div.inputbox#mass${direction}`),
                function(){
                    Input.changeMassBooleans[direction] = true
                },
                function(){
                    Input.changeMassBooleans[direction] = false
                },
            )
        }
        for (let direction of 'up down'.split(' ')){
            new EventHandlerForMouseDownAndUp(
                document.querySelector(`div.inputbox#time${direction}`),
                function(){
                    Input.changeTimeBooleans[direction] = true
                },
                function(){
                    Input.changeTimeBooleans[direction] = false
                },
            )
        }
        for (let direction of 'in out'.split(' ')){
            new EventHandlerForMouseDownAndUp(
                document.querySelector(`div.inputbox#zoom${direction}`),
                function(){
                    Input.changeZoomBooleans[direction] = true
                },
                function(){
                    Input.changeZoomBooleans[direction] = false
                },
            )
            new EventHandlerForKeyDownAndUp(
                {in : 'p', out : 'q'}[direction],
                function(){
                    Input.changeZoomBooleans[direction] = true
                },
                function(){
                    Input.changeZoomBooleans[direction] = false
                },
            )
        }

        document.addEventListener('mousemove',
        function(event){
            Input.mousex = (event.clientX - Draw.boundingRect.left) * Draw.resolutionScale
            Input.mousey = (event.clientY - Draw.boundingRect.top) * Draw.resolutionScale
        })
    }
}

class Tools {
    static linearToolMouseUp(){
        let newSphere = new Sphere(
            Input.mousexAtStartOfAim,
            Input.mouseyAtStartOfAim,
            Settings.newMassFactor * 10000
        )
        newSphere.vx = (-Input.mousexAtStartOfAim + Input.mousex) / 7
        newSphere.vy = (-Input.mouseyAtStartOfAim + Input.mousey) / 7
    }
    static orbitToolMouseUp(){

        let newX = Input.mousex
        let newY = Input.mousey
        let newMass = Settings.newMassFactor * 10000

        let orbitVelocity = Sphere.calculateVelocityNeededToOrbitCenterOfMass(newX, newY, newMass)
        
        let newSphere = new Sphere(
            newX,
            newY,
            newMass
        )
        newSphere.vx = orbitVelocity.vx
        newSphere.vy = orbitVelocity.vy
    }
}


setTimeout(() => {
    Input.registerEventsAfterPageLoad()
    Settings.updateAllContinuousPropertyValues()
}, 300);
