'use strict';


class Simulator {
    static debugMode = false
    static fps = 0
    static fpsFramesToAverageCalculationOver = 60
    static _fpsFrameSkipCounter = 0
    static _fpsLastMeasurementTimestamp = performance.now()
    static calculateFPS(){
        this._fpsFrameSkipCounter++
        
        if (this._fpsFrameSkipCounter >= this.fpsFramesToAverageCalculationOver){
            this._fpsFrameSkipCounter = 0

            this.fps = 1000 * this.fpsFramesToAverageCalculationOver / (performance.now() - this._fpsLastMeasurementTimestamp)
            this._fpsLastMeasurementTimestamp = performance.now()
            document.querySelector('span.topheaderstats#fps').innerText = `${this.fps.toPrecision(3)} FPS`
        }
    }
    static tick(){
        PeriodicJob.processJobQueue()
        Settings.updateContinuousPropertyValuesBasedOnInputBooleans()
        Sphere.setNetForceAndImpulseToZeroAndMoveSpheresForView() // must be called first as it sets forces to 0
        Sphere.updateGravityNetForceAndImpulseForAllFaster()
        Draw.animationFrame()
        Simulator.calculateFPS()
        requestAnimationFrame(Simulator.tick)
    }
    static init(){
        setTimeout(() => {
            Draw.initializeDrawingCanvas()
            State.loadStateAndSettingsFromHash()
            Simulator.initializePeriodicJobs()
            Simulator.tick()
            Sphere.totalMass = 0
            Sphere.totalSpheres = 0
        }, 100)
        
    }
    static initializePeriodicJobs(){
        // new PeriodicJob(
        //     function(){
        //         document.querySelector('span.topheaderstats#totalmomentum').innerHTML = `P<sub>net,x</sub> = ${
        //             Settings.valueBoxNiceNumericalFormatting(Sphere.calculateTotalMomentum('x') * Utility.zoom)
        //         }, P<sub>net,y</sub> = ${
        //             Settings.valueBoxNiceNumericalFormatting(Sphere.calculateTotalMomentum('y') * Utility.zoom)
        //         }`
        //     },
        //     25,
        //     'ticks'
        // )
        new PeriodicJob(
            function(){
                document.querySelector('span.topheaderstats#totalmass').innerHTML = `${Utility.formatNumberInScientificNotation(Sphere.totalMass)} Total Mass`
            },
            7,
            'ticks'
        )
        // new PeriodicJob(
        //     function(){
        //         document.querySelector('span.topheaderstats#totalmomentum').innerHTML = `${Utility.formatNumberInScientificNotation(Sphere.calculateTotalMomentumLength())} Total Momentum`
        //     },
        //     20,
        //     'ticks'
        // )
        new PeriodicJob(
            function(){
                Sphere.checkAllSpheresForCollisions()
                Sphere.checkForInactiveSphereCleanupJob()
            },
            2,
            'ticks'
        )
    }
}

class PeriodicJob {
    procedure
    tickSpacing
    msSpacing
    schedulingType
    runNextTimeQueueIsProcessed
    id
    ticksSinceLastProduceCall
    constructor(procedure, numberSpacingInTicksOrMs, ticksOrMs){
        this.procedure = procedure

        switch (ticksOrMs.toLowerCase()) {
            case 'ms':
                this.schedulingType = 'ms'
                this.msSpacing = numberSpacingInTicksOrMs
                this.runNextTimeQueueIsProcessed = false

                let self = this
                setTimeout(() => {
                    self.runNextTimeQueueIsProcessed = true
                }, self.msSpacing);

                break;
            case 'ticks':
                this.schedulingType = 'ticks'
                this.tickSpacing = numberSpacingInTicksOrMs
                this.ticksSinceLastProduceCall = 0
                break;
            default:
                console.error(`Scheduling type ${ticksOrMs} not understood. Valid options are 'ms' or 'ticks'`)
                break;
        }

        this._id = Utility.nextID
        PeriodicJob.jobs[this._id] = this 
    }
    processJobTicksType(){
        if (this.ticksSinceLastProduceCall >= this.tickSpacing){
            this.ticksSinceLastProduceCall = 0
            this.procedure()
        }
        else{
            this.ticksSinceLastProduceCall ++
        }
    }
    processJobMsType(){
        let self = this
        if (this.runNextTimeQueueIsProcessed){
            this.runNextTimeQueueIsProcessed = false
            setTimeout(() => {
                self.runNextTimeQueueIsProcessed = true
            }, self.msSpacing);
            this.procedure()
        }
    }

    static jobs = {}
    static processJobQueue(){
        let allIDs = Object.keys(PeriodicJob.jobs)

        for (let id of allIDs){
            
            let job = PeriodicJob.jobs[id]

            switch (job.schedulingType) {
                case 'ms':
                    job.processJobMsType()
                    break;
                case 'ticks':
                    job.processJobTicksType()
                    break;
                default:
                    break;
            }
        }
    }
}

Simulator.init()

