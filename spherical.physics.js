'use strict';

class Sphere {
    x // x position
    y // y position
    vx // x velocity
    vy // y velocity
    fnetx // net force along x
    fnety // net force along y
    jnetx // impulse x
    jnety // impulse y
    active // if false, then this sphere is marked to have its reference deleted
           // from Sphere.spheres, allowing its memory to be freed by runtime's GC

    polarColor
    equatorColor
    atmosphereColor
    type

    traceVerticiesX = []
    traceVerticiesY = []

    _id
    _radius
    _mass
    _density

    static _totalSpheres = 0
    static _totalMass = 0
    static maximumSpheresInSystem = 500

    static get totalMass(){
        return Sphere._totalMass
    }
    static set totalMass(newTotal){
        Sphere._totalMass = newTotal
    }

    static get totalSpheres(){
        return Sphere._totalSpheres
    }
    static set totalSpheres(newTotal){
        Sphere._totalSpheres = newTotal
        document.querySelector('span.topheaderstats#totalspheres').innerText = `${newTotal} Object${newTotal == 1 ? '' : 's'}`
    }

    constructor(x = 0, y = 0, mass = (100000 * Settings.newMassFactor), density = 1){
        this.active = true
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.fnetx = 0;
        this.fnety = 0;
        this.jnetx = 0;
        this.jnety = 0;
        this.density = density
        this.mass = mass
        this._id = Utility.nextID
        Sphere.spheres[this._id] = this
        Sphere.totalSpheres = Object.keys(Sphere.spheres).length
        Sphere.totalMass += this.mass

        this.polarColor = Sphere.getRandomSphereColor()
        this.equatorColor = Sphere.getRandomSphereColor()
        this.atmosphereColor = Sphere.getRandomSphereColor(0.4)

        this.checkForSphereTypeChange()

        if (Sphere.totalSpheres > Sphere.maximumSpheresInSystem){
            // maximum sphere count for performance
            this.active = false
        }

    }

    static spheres = {} // references all active spheres
    static physicalConstant = {
        G : 10E-3,
        smallestDistance : 10E-3, // prevent div0
        maximumFragmentsPerCollision : 15,
        maximumFragmentVelocityIsThisManyTimesTheEscapeVelocity : 1.0,
        maximumTraceSegmentLength : 500,
        maxVerticiesToStore : 200,
    }
    static zoomAllSpheresByFactor(factor){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]

            sphere.x /= factor
            sphere.y /= factor

            sphere.x += Draw.drawingCanvas.width * (factor - 1) / (2 * factor)
            sphere.y += Draw.drawingCanvas.height * (factor - 1) / (2 * factor)  

            sphere.traceVerticiesX = sphere.traceVerticiesX.map( x => x / factor)
            sphere.traceVerticiesY = sphere.traceVerticiesY.map( x => x / factor)

            sphere.traceVerticiesX = sphere.traceVerticiesX.map( x => x + Draw.drawingCanvas.width * (factor - 1) / (2 * factor))
            sphere.traceVerticiesY = sphere.traceVerticiesY.map( x => x + Draw.drawingCanvas.height * (factor - 1) / (2 * factor))

            sphere.vx /= factor
            sphere.vy /= factor

            sphere.updateRadius()
        }
    }
    static calculateEscapeVelocity(planetToEscapeFrom, fragment){
        // returns the fragment velocity needed to escape the gravitational pull of the planet
        let distance = Sphere.getDistanceBetweenSpheres(
            planetToEscapeFrom,
            fragment
        )
        return Math.sqrt(
            2 * Sphere.physicalConstant.G * planetToEscapeFrom.mass / distance
        )
    }
    static collisionChecker(sphereA, sphereB, scaledDistance){

        let distance = scaledDistance / Utility.zoom

        let isNotSameSphere = !(sphereA.id == sphereB.id)

        let bothAreActive = sphereA.active && sphereB.active

        if (bothAreActive && isNotSameSphere){
            // check if the spheres are colliding
            let radiusOfCollision = Math.max(sphereB.r, sphereA.r)

            if (distance < radiusOfCollision){
                // keep the properties of the larger one
                if (sphereA.mass > sphereB.mass){
                    Sphere.collisionHandler(sphereA, sphereB, distance)
                }
                else{
                    Sphere.collisionHandler(sphereB, sphereA, distance)
                }
            }
        }
    }
    static collisionHandler(sphereA, sphereB, distance){
        // absord all mass from one sphere into the other

        let combinedMomentumX = (sphereA.mass * sphereA.vx) + (sphereB.mass * sphereB.vx)
        let combinedMomentumY = (sphereA.mass * sphereA.vy) + (sphereB.mass * sphereB.vy)

        // we just gave all of its momentum to the combined system, so remove it from sphereB
        sphereB.vx = 0
        sphereB.vy = 0

        // even though we gave all of B's mass to A, leave B's mass around for now since we 
        // will use it as an accounting tool in the while loop. It is set to 0 at the end of 
        // the procedure instead of up here
        let combinedMass = (sphereA.mass + sphereB.mass)

        let angleBetweenSpheres = Sphere.getAngleBetweenSpheres(sphereA, sphereB)

        // new CollisionEffect(sphereA, 'white', 0, 22, 10)
        // new CollisionEffect(sphereA, sphereB.equatorColor, 0, 60, 7)
        new CollisionEffect(sphereA, sphereB.polarColor, 3, 30, 13, sphereB.x, sphereB.y, sphereB.r)

        let countFragmentsAddedDuringThisCollision = 1

        while ( (countFragmentsAddedDuringThisCollision < Sphere.physicalConstant.maximumFragmentsPerCollision) && (sphereB.mass > 10000) && (Sphere.totalSpheres < (Sphere.maximumSpheresInSystem - 1)) ){

            let maximumNextMass = sphereB.mass / 2
            let nextMass = (Math.random()/3/countFragmentsAddedDuringThisCollision + 1/40) * maximumNextMass

            if (sphereB.mass - nextMass < 0){
                nextMass = sphereB.mass
            }

            let nextTheta = (Math.random() - 0.5) + angleBetweenSpheres
            let nextX = Math.cos(nextTheta) * distance * 1.1 + sphereA.x
            let nextY = Math.sin(nextTheta) * distance * 1.1 + sphereA.y

            let nextFragment = new Sphere(
                nextX,
                nextY,
                nextMass
            )

            let maximumNextV = Sphere.physicalConstant.maximumFragmentVelocityIsThisManyTimesTheEscapeVelocity 
                                / Utility.zoom
                                * Sphere.calculateEscapeVelocity(
                                    sphereA,
                                    nextFragment
                                )

            let nextThetaOffsetFromRelativePositionDirection = ( Math.random() - 0.5 ) * 3

            let nextVX = Math.cos(nextTheta + nextThetaOffsetFromRelativePositionDirection) * maximumNextV 
            let nextVY = Math.sin(nextTheta + nextThetaOffsetFromRelativePositionDirection) * maximumNextV 

            countFragmentsAddedDuringThisCollision++

            nextFragment.vx = nextVX
            nextFragment.vy = nextVY

            combinedMass -= nextMass
            combinedMomentumX -= nextMass * nextVX
            combinedMomentumY -= nextMass * nextVY

            sphereB.mass -= nextMass
            
        }

        sphereA.mass = combinedMass
        sphereB.mass = 0

        sphereA.vx = ( combinedMomentumX ) / combinedMass
        sphereA.vy = ( combinedMomentumY ) / combinedMass

        sphereB.jnetx = 0
        sphereB.jnety = 0

        sphereB.fnetx = 0
        sphereB.fnety = 0

        
    }
    static applyGravityForceAndImpulse(sphereA, sphereB, distance){
        
        let deltaX = ( sphereB.x - sphereA.x )
        let deltaY = ( sphereB.y - sphereA.y )
        
        let forceMagnitude = Sphere.physicalConstant.G * sphereA.mass * sphereB.mass / Math.pow(distance,2)

        let deltaFnetx = forceMagnitude * (deltaX)/distance
        let deltaFnety = forceMagnitude * (deltaY)/distance

        let deltaJnetx = deltaFnetx * Utility.timeQuantum
        let deltaJnety = deltaFnety * Utility.timeQuantum

        sphereA.fnetx += deltaFnetx
        sphereA.fnety += deltaFnety

        sphereA.jnetx += deltaJnetx
        sphereA.jnety += deltaJnety

        // Newton's third law lets us apply same mantitude in opposite direction

        sphereB.jnetx -= deltaJnetx
        sphereB.jnety -= deltaJnety

        sphereB.fnetx -= deltaFnetx
        sphereB.fnety -= deltaFnety

    }
    static getDistanceBetweenCoordinates(x1, y1, x2, y2){

        let deltaX = ( x2 - x1 )
        let deltaY = ( y2 - y1 ) 

        let distance = Math.max(
            Math.sqrt( Math.pow(deltaX,2) + Math.pow(deltaY,2) ),
            Sphere.physicalConstant.smallestDistance
        ) * Utility.zoom

        return distance
    }
    static getDistanceBetweenSpheres(sphereA, sphereB){

        let deltaX = ( sphereB.x - sphereA.x )
        let deltaY = ( sphereB.y - sphereA.y ) 

        let distance = Math.max(
            Math.sqrt( Math.pow(deltaX,2) + Math.pow(deltaY,2) ),
            Sphere.physicalConstant.smallestDistance
        ) * Utility.zoom

        return distance
    }
    static getAngleBetweenSpheres(sphereA, sphereB){

        let deltaX = ( sphereB.x - sphereA.x )
        let deltaY = ( sphereB.y - sphereA.y ) 

        let angle = Math.atan2(
            deltaY,
            deltaX
        )

        return angle
    }
    static getAngleBetweenCoordinates(x1, y1, x2, y2){

        let deltaX = ( x2 - x1 )
        let deltaY = ( y2 - y1 ) 

        let angle = Math.atan2(
            deltaY,
            deltaX
        )

        return angle
    }
    static updateGravityNetForceAndImpulseForAll(){
        let allIDs = Object.keys(Sphere.spheres)
        let idsNotDoneYet = Object.keys(Sphere.spheres)
        
        for (let idA of allIDs){

            let sphereA = Sphere.spheres[idA]

            // Newton's third law 
            idsNotDoneYet.splice(
                idsNotDoneYet.indexOf(idA), // remove from inner loop those already done in outer loop
                1 // remove just that one value, not the rest of the array
            )
            for (let idB of idsNotDoneYet){

                let sphereB = Sphere.spheres[idB]

                let distance = Sphere.getDistanceBetweenSpheres(
                    sphereA,
                    sphereB
                )

                Sphere.applyGravityForceAndImpulse(
                    sphereA,
                    sphereB,
                    distance
                )
            }
            Sphere.updateVelocityAndPosition( 
                sphereA
            )
            if (Input.showEffectToggleBooleans.tracesEffect || Input.showEffectToggleBooleans.areaEffect){
                sphereA.storePositionAsPathTraceVertex()
            }
            
        }

    }
    static updateGravityNetForceAndImpulseForAllFaster(){

        let idsCurrentlyUsedByActiveSpheres = Object.keys(Sphere.spheres)

        let indexA = idsCurrentlyUsedByActiveSpheres.length
        while (indexA > 0){
            indexA--
            let idA = idsCurrentlyUsedByActiveSpheres[indexA]
            let sphereA = Sphere.spheres[idA]

            let indexB = indexA
            while (indexB > 0){
                indexB--
                let idB = idsCurrentlyUsedByActiveSpheres[indexB]
                let sphereB = Sphere.spheres[idB]
                
                let distance = Sphere.getDistanceBetweenSpheres(
                    sphereA,
                    sphereB
                )

                Sphere.applyGravityForceAndImpulse(
                    sphereA,
                    sphereB,
                    distance
                )
            }
            Sphere.updateVelocityAndPosition( 
                sphereA
            )
            if (Input.showEffectToggleBooleans.tracesEffect || Input.showEffectToggleBooleans.areaEffect){
                sphereA.storePositionAsPathTraceVertex()
            }
        }

    }
    static updateVelocityAndPosition(sphere){

        if (sphere.mass <= 0){
            // just to prevent div0 before massless objects are removed up by cleanup job
            return
        }

        sphere.vx += sphere.jnetx / sphere.mass
        sphere.vy += sphere.jnety / sphere.mass

        sphere.x += sphere.vx * Utility.timeQuantum
        sphere.y += sphere.vy * Utility.timeQuantum
    
    }
    static moveSphereForViewMove(sphere){
        if (Input.moveViewBooleans.left == true){
            sphere.x += Settings.moveViewSpeed
        }
        if (Input.moveViewBooleans.right == true){
            sphere.x -= Settings.moveViewSpeed
        }
        if (Input.moveViewBooleans.up == true){
            sphere.y += Settings.moveViewSpeed
        }
        if (Input.moveViewBooleans.down == true){
            sphere.y -= Settings.moveViewSpeed
        }
    }
    static moveSphereTracesForViewMove(sphere){
        if (Input.moveViewBooleans.left == true){
            sphere.traceVerticiesX = sphere.traceVerticiesX.map( x => x + Settings.moveViewSpeed)
        }
        if (Input.moveViewBooleans.right == true){
            sphere.traceVerticiesX = sphere.traceVerticiesX.map( x => x - Settings.moveViewSpeed)
        }
        if (Input.moveViewBooleans.up == true){
            sphere.traceVerticiesY = sphere.traceVerticiesY.map( x => x + Settings.moveViewSpeed)
        }
        if (Input.moveViewBooleans.down == true){
            sphere.traceVerticiesY = sphere.traceVerticiesY.map( x => x - Settings.moveViewSpeed)
        }
    }
    static checkForInactiveSphereCleanupJob(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]

            if (sphere.active == false){
                sphere.remove()
            }
        }
    }
    static clearAllSpherePathTraces(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]

            sphere.traceVerticiesX = []
            sphere.traceVerticiesY = []
        }
    }
    static immediatleyDeleteAllSpheres(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]

            sphere.remove()
        }
    }
    static setNetForceAndImpulseToZeroAndMoveSpheresForView(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let idA of allIDs){
            let sphereA = Sphere.spheres[idA]

            Sphere.moveSphereForViewMove(sphereA)
            Sphere.moveSphereTracesForViewMove(sphereA)

            // we want to calculate instantaneous impulse and net force for each frame / tick
            // rather than integrate it over time, so we reset these at the start of each tick

            sphereA.fnetx = 0
            sphereA.fnety = 0

            sphereA.jnetx = 0
            sphereA.jnety = 0
        }
    }
    static checkAllSpheresForCollisions(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let idA of allIDs){
            let sphereA = Sphere.spheres[idA]

            for (let idB of allIDs){

                if (idA == idB){
                    continue
                }

                let sphereB = Sphere.spheres[idB]

                let distance = Sphere.getDistanceBetweenSpheres(
                    sphereA,
                    sphereB
                )

                Sphere.collisionChecker(
                    sphereA, 
                    sphereB, 
                    distance
                )

            }

        }
    }
    static getRandomSphereColor(alpha = 1){
        return `hsla(${Math.round(Math.random()*340)}, 60%, 45%, ${alpha})`
    }
    static starColors = [
        'hsla(16, 100%, 50%, 1)', // red
        'hsla(43, 74%, 49%, 1)', // yellow
        'hsla(216, 100%, 58%, 1)', // blue
    ]
    static getRandomStarColor(alpha = 1){
        let randomStarColorIndex = Math.round( Math.random() * (Sphere.starColors.length - 1) )
        return Sphere.starColors[randomStarColorIndex]
    }
    storePositionAsPathTraceVertex(){

        let angularDeviationBeforeStoringVertex = 0.03 // radians 
        let maxVerticiesToStore = Sphere.physicalConstant.maxVerticiesToStore / Math.sqrt( Sphere.totalSpheres )

        let x = this.x
        let y = this.y

        let lastTraceIndex = this.traceVerticiesX.length - 1
        let penultimateTraceIndex = lastTraceIndex - 1

        while (lastTraceIndex > maxVerticiesToStore){
            // if the array is too long, drop the least recent stored vertex
            this.traceVerticiesX.shift()
            this.traceVerticiesY.shift()

            lastTraceIndex = this.traceVerticiesX.length - 1
            penultimateTraceIndex = lastTraceIndex - 1
        }

        if (penultimateTraceIndex >= 1){

            let penultimateTraceX = this.traceVerticiesX[penultimateTraceIndex]
            let penultimateTraceY = this.traceVerticiesY[penultimateTraceIndex]

            let lastTraceX = this.traceVerticiesX[lastTraceIndex]
            let lastTraceY = this.traceVerticiesY[lastTraceIndex]

            let deltaX = lastTraceX - penultimateTraceX
            let deltaY = lastTraceY - penultimateTraceY

            let lastRecordedPathSegmentAngle = Math.atan2(deltaY, deltaX)

            let currentPathSegmentAngle = Math.atan2(
                y - lastTraceY,
                x - lastTraceX
            )

            if ( Math.abs( currentPathSegmentAngle - lastRecordedPathSegmentAngle ) > angularDeviationBeforeStoringVertex ){
                this.traceVerticiesX.push(x)
                this.traceVerticiesY.push(y)
            }
            else{
                if (Sphere.getDistanceBetweenCoordinates(x, y, penultimateTraceX, penultimateTraceY) < Sphere.physicalConstant.maximumTraceSegmentLength * Utility.zoom){
                    this.traceVerticiesX.pop()
                    this.traceVerticiesY.pop()
                    this.traceVerticiesX.push(x)
                    this.traceVerticiesY.push(y)
                }
                else{
                    this.traceVerticiesX.push(x)
                    this.traceVerticiesY.push(y)
                }
            }
        }
        else if ((y != this.traceVerticiesY[lastTraceIndex]) && (x != this.traceVerticiesX[lastTraceIndex])){
            this.traceVerticiesX.push(x)
            this.traceVerticiesY.push(y)
        }

    }
    checkForSphereTypeChange(){
        let mass = this.mass

        if (mass > 10E8){
            if (this.type != 'giantStar'){
                this.becomeGiantStar()
            }
            return
        }
        if (mass > 10E6){
            if ((this.type != 'standardStar')){
                this.becomeStandardStar()
            }
            return
        }
    }
    becomeGiantStar(){
        let newColor = Sphere.getRandomStarColor()

        this.polarColor = newColor
        this.equatorColor = 'hsla(0, 0%, 100%, 0)'
        this.atmosphereColor = newColor
        this.type = 'giantStar'
    }
    becomeStandardStar(){
        let newColor = Sphere.getRandomStarColor()

        this.polarColor = newColor
        this.equatorColor = 'hsla(0, 0%, 100%, 0)'
        this.atmosphereColor = newColor
        this.type = 'standardStar'
    }
    static calculateTotalMass(){
        let allIDs = Object.keys(Sphere.spheres)

        let totalInProgress = 0
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]
            totalInProgress += sphere.mass
        }   
        return totalInProgress
    }
    static calculateTotalMomentum(stringDimensionXorY = 'x'){

        stringDimensionXorY = stringDimensionXorY.toLowerCase()

        if ( (stringDimensionXorY != 'x') && (stringDimensionXorY != 'y') ){
            console.error(`Direction '${stringDimensionXorY}' not understood. Please specify 'x' or 'y'`)
            return undefined
        }

        let allIDs = Object.keys(Sphere.spheres)

        let totalInProgress = 0
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]
            totalInProgress += sphere[`v${stringDimensionXorY}`] * sphere.mass
        }   
        return totalInProgress
    }
    static calculateTotalMomentumLength(){
        let px = Sphere.calculateTotalMomentum('x')
        let py = Sphere.calculateTotalMomentum('y')
        return Math.sqrt( px**2 + py**2 )
    }
    static calculateCenterOfMass(newX = 0, newY = 0, newMass = 0){
        // pass no arguments to get the current COM
        // pass properties of the new sphere to get the COM if that sphere were to be added
        let allIDs = Object.keys(Sphere.spheres)

        let totalInProgressX = 0
        let totalInProgressY = 0
        let totalInProgressMass = 0
        
        for (let id of allIDs){
            let sphere = Sphere.spheres[id]

            totalInProgressX += sphere.x * sphere.mass
            totalInProgressY += sphere.y * sphere.mass
            totalInProgressMass += sphere.mass
        }

        let CenterX = totalInProgressX / totalInProgressMass
        let CenterY = totalInProgressY / totalInProgressMass

        return {x : CenterX, y : CenterY}
    }
    static calculateNetForceOnNewSphere(newX, newY, newMass){
        let allIDs = Object.keys(Sphere.spheres)

        let totalInProgressX = 0
        let totalInProgressY = 0
        
        for (let id of allIDs){

            let sphereB = Sphere.spheres[id]

            let deltaX = ( sphereB.x - newX )
            let deltaY = ( sphereB.y - newY ) 

            let distance = Sphere.getDistanceBetweenCoordinates(
                sphereB.x,
                sphereB.y,
                newX,
                newY
            )
            
            let forceMagnitude = Sphere.physicalConstant.G * newMass * sphereB.mass / Math.pow(distance,2)

            let deltaFnetx = forceMagnitude * (deltaX)/distance
            let deltaFnety = forceMagnitude * (deltaY)/distance

            totalInProgressX += deltaFnetx
            totalInProgressY += deltaFnety
        }

        return {x : totalInProgressX, y : totalInProgressY}
    }
    static calculateVelocityNeededToOrbitCenterOfMass(newX, newY, newMass){

        let centerOfMass = Sphere.calculateCenterOfMass(newX, newY, newMass)

        let centerX = centerOfMass.x
        let centerY = centerOfMass.y

        let angleToCenterOfMassFromNewSphere = Sphere.getAngleBetweenCoordinates(
            centerX,
            centerY,
            newX,
            newY
        ) + Math.PI / 2

        if (Simulator.debugMode){
            console.log(`Angle between system center of mass and mouse is ${angleToCenterOfMassFromNewSphere}.`)
        }

        let distance = Sphere.getDistanceBetweenCoordinates(
            centerX,
            centerY,
            newX,
            newY
        )

        let netForceVector = Sphere.calculateNetForceOnNewSphere(newX, newY, newMass)

        let netForceScalar = Math.sqrt(
            Utility.hypot(netForceVector.x, netForceVector.y) / Utility.zoom * distance / newMass
        ) 

        let newVX = Math.cos(angleToCenterOfMassFromNewSphere) * netForceScalar

        let newVY = Math.sin(angleToCenterOfMassFromNewSphere) * netForceScalar

        return {vx : newVX, vy : newVY}

    }
    remove(){
        this.LogIfHasNonZeroValueForMotionQuantities()
        // immeditley deletes the reference to this sphere
        // set active = false to mark for deletion via cleanup job
        delete Sphere.spheres[this.id]
        Sphere.totalSpheres = Object.keys(Sphere.spheres).length
        Sphere.totalMass = Sphere.calculateTotalMass()
    }
    static totalNonZeroMotionQuantitiesWarningsIssued = 0
    LogIfHasNonZeroValueForMotionQuantities(){
        if (Simulator.debugMode){
            for (let property of 'vx vy mass'.split(' ')){
                if (this[property] != 0){
                    if (Sphere.totalNonZeroMotionQuantitiesWarningsIssued < 10){
                        console.warn(`Property ${property} had nonzero value of ${this[property]} at time of removal. Are you conserving both mass and momentum?`)
                        Sphere.totalNonZeroMotionQuantitiesWarningsIssued ++
                    }
                    else if (Sphere.totalNonZeroMotionQuantitiesWarningsIssued == 10){
                        console.warn(`Property ${property} had nonzero value of ${this[property]} at time of removal. Are you conserving both mass and momentum? Hiding further warnings of this type.`)
                        Sphere.totalNonZeroMotionQuantitiesWarningsIssued ++
                    }
                }
            }
        }
    }
    updateRadius(){
        // radius is a read-only property which is determined by mass, density
        // setters of mass, density call this to keep it up to date with any change
        this._radius = Math.cbrt(this.mass * 3 / ( this.density * 4 * Math.PI )) / Utility.zoom
    }
    get id(){
        return this._id
    }
    get mass(){
        return this._mass
    }
    get m(){
        return this._mass
    }
    set mass(newMass){
        if (newMass < 0){
            console.error('Mass must be positive. Not changing it.')
            return
        }
        if (newMass == 0){ // if massless, there is no matter, so mark object for cleanup
            this.active = false
        }

        this.checkForSphereTypeChange()

        this._mass = newMass
        this.updateRadius()
    }
    get density(){
        return this._density
    }
    get rho(){
        return this._density
    }
    get p(){
        return this._density
    }
    set density(newDensity){
        if (newDensity <= 0){
            console.error('Density must be positive. Not changing it.')
            return
        }
        this._density = newDensity
        this.updateRadius()
    }
    get r(){
        return this._radius
    }
    get radius(){
        return this._radius
    }
}
    
class Utility {
    static _idIncrementer = 0
    static timeHiddenScalingFactor = 0.2
    static get nextID(){
        return (this._idIncrementer++)
    }
    static _zoomFactor = 1
    static get zoom(){
        return this._zoomFactor
    }
    static set zoom(newValue){
        this._zoomFactor = newValue
        Input.changeZoomBooleans.valueBoxElement.innerHTML = Settings.valueBoxNiceNumericalFormatting(1 / Utility.zoom)
    }
    static zoomIn(factor){
        this.zoom *= factor
        Sphere.zoomAllSpheresByFactor(factor)
    }
    static get timeQuantum(){
        return Settings.timeSpeedFactor * Utility.timeHiddenScalingFactor
    }
    static formatNumberInScientificNotation(number, precision = 3){

        let sciNotation = number.toPrecision(precision)

        if ( sciNotation.match(/[eE][\+\-]/) != null ){
            return `${sciNotation.replace(/[eE]/, '&sdot;10<sup>')}</sup>`
        }
        return sciNotation
    }
    static hypot(a, b){
        return Math.sqrt( a**2 + b**2 )
    }
}