'use strict';


class Draw {
    static resolutionScale = 2 // can increase this if the screen looks pixelated
    static transparent = 'rgba( 0, 0, 0, 0)'
    static initializeDrawingCanvas(){
        this.drawingCanvas = document.querySelector('canvas#canvas');
        this.drawingCanvas.width = window.innerWidth*Draw.resolutionScale;
        this.drawingCanvas.height = window.innerHeight*Draw.resolutionScale;
        this.boundingRect = this.drawingCanvas.getBoundingClientRect()
        this.ctx = this.drawingCanvas.getContext('2d');
    }
    static drawSphere(sphere){
        switch (sphere.type) {
            case 'standardStar':
                this.drawStar(sphere)
                break;
            case 'giantStar':
                this.drawStar(sphere)
                break;
            default:
                this.drawPlanet(sphere)
                break;
        }
    }
    static drawPlanet(sphere){
        let atmosphereRadiusFactor = 1.2
        let x = sphere.x
        let y = sphere.y
        let r = sphere.r /// Utility.zoom
        let polarColor = sphere.polarColor
        let equatorColor = sphere.equatorColor
        let atmosphereColor = sphere.atmosphereColor
        let ctx = this.ctx

        let gradient = ctx.createLinearGradient(
            x, y - r,
            x, y + r
        )

        // draw planet

        gradient.addColorStop(0, polarColor);
        gradient.addColorStop(0.5, equatorColor);
        gradient.addColorStop(1, polarColor);

        ctx.fillStyle = gradient
        
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.closePath()
        ctx.fill()

        // draw atmosphere

        ctx.fillStyle = atmosphereColor

        ctx.beginPath()
        ctx.arc(x, y, r * atmosphereRadiusFactor, 0, 2 * Math.PI);
        ctx.closePath()
        ctx.fill()
    }
    static drawStar(sphere){
        let atmosphereRadiusFactor = 2
        let x = sphere.x
        let y = sphere.y
        let r = sphere.r /// Utility.zoom
        let polarColor = sphere.polarColor
        let equatorColor = sphere.equatorColor
        let atmosphereColor = sphere.atmosphereColor
        let ctx = this.ctx

        // draw atmosphere

        let gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, r * atmosphereRadiusFactor
        )

        gradient.addColorStop(0.9 / atmosphereRadiusFactor, polarColor);
        gradient.addColorStop(1, this.transparent);

        ctx.fillStyle = gradient

        ctx.beginPath()
        ctx.arc(x, y, r * atmosphereRadiusFactor, 0, 2 * Math.PI);
        ctx.closePath()
        ctx.fill()

        // draw star

        gradient = ctx.createRadialGradient(
            x, y, 0,
            x, y, r
        )

        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, polarColor);

        ctx.fillStyle = gradient
        
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.closePath()
        ctx.fill()

        
    }
    static opacityAsFunctionOfClosenessToEndOfArray(arrayPosition, arrayLength){
        return 0.5 * Math.sqrt( (arrayPosition) / (arrayLength) )
    }
    static drawSpherePathTrace(sphere){
        let x = sphere.x
        let y = sphere.y
        let r = sphere.r
        let tracesX = sphere.traceVerticiesX
        let tracesY = sphere.traceVerticiesY
        let polarColor = sphere.polarColor
        let equatorColor = sphere.equatorColor
        let atmosphereColor = sphere.atmosphereColor
        let ctx = this.ctx

        let traceLastIndex = tracesX.length - 2
        let currentIndex = traceLastIndex

        ctx.lineWidth = Math.max(
            Math.sqrt(r),
            1
        )

        let currentX
        let currentY

        while (currentIndex >= 0){
            currentX = tracesX[currentIndex]
            currentY = tracesY[currentIndex]

            let previousX = tracesX[currentIndex + 1]
            let previousY = tracesY[currentIndex + 1]

            ctx.strokeStyle = equatorColor.replace(' 1)', ` ${this.opacityAsFunctionOfClosenessToEndOfArray(currentIndex, traceLastIndex)})`)

            ctx.beginPath()
            ctx.moveTo(previousX, previousY)
            ctx.lineTo(currentX, currentY)
            ctx.stroke()
            currentIndex--
        }

    }
    static drawSpherePathTraceNoGradient(sphere){
        let x = sphere.x
        let y = sphere.y
        let r = sphere.r
        let tracesX = sphere.traceVerticiesX
        let tracesY = sphere.traceVerticiesY
        let polarColor = sphere.polarColor
        let equatorColor = sphere.equatorColor
        let atmosphereColor = sphere.atmosphereColor
        let ctx = this.ctx

        let traceLastIndex = tracesX.length - 1
        let currentIndex = traceLastIndex

        ctx.lineWidth = Math.max(
            Math.sqrt(r),
            1
        )

        let currentX = tracesX[currentIndex]
        let currentY = tracesY[currentIndex]

        ctx.moveTo(currentX, currentY)

        ctx.beginPath()

        while (currentIndex >= 0){
            currentX = tracesX[currentIndex]
            currentY = tracesY[currentIndex]

            ctx.lineTo(currentX, currentY)
            
            currentIndex--
        }
        ctx.strokeStyle = atmosphereColor
        ctx.stroke()

    }
    static drawSphereAreaTrace(sphere){
        let x = sphere.x
        let y = sphere.y
        let r = sphere.r
        let tracesX = sphere.traceVerticiesX
        let tracesY = sphere.traceVerticiesY
        let polarColor = sphere.polarColor
        let equatorColor = sphere.equatorColor
        let atmosphereColor = sphere.atmosphereColor
        let ctx = this.ctx

        let traceLastIndex = tracesX.length - 2
        let currentIndex = traceLastIndex

        ctx.lineWidth = Math.max(
            Math.sqrt(r),
            1
        )

        let currentX
        let currentY

        while (currentIndex >= 4){
            currentX = tracesX[currentIndex]
            currentY = tracesY[currentIndex]

            let previousX = tracesX[currentIndex + 1]
            let previousY = tracesY[currentIndex + 1]

            ctx.strokeStyle = equatorColor.replace(' 1)', ` ${this.opacityAsFunctionOfClosenessToEndOfArray(currentIndex, traceLastIndex)})`)

            ctx.beginPath()
            ctx.moveTo(previousX, previousY)
            ctx.lineTo(currentX, currentY)
            ctx.lineTo(x, y)
            ctx.stroke()
            currentIndex--
        }

    }
    static drawVectorFromPoint(originX, originY, vectorMagnitudeX, vectorMagnitudeY, strokeStyleString = 'orange'){
        let arrowBarbAngle = 0.2 // radians
        let arrowBarbLengthAsFractionOfSegmentLength = 0.3 // dimensionless

        let ctx = this.ctx
        let arrowHeadX = originX + vectorMagnitudeX
        let arrowHeadY = originY + vectorMagnitudeY
        let lineSegmentLength = Math.sqrt( // Pythagoras
            Math.pow(vectorMagnitudeX, 2) + Math.pow( vectorMagnitudeY, 2)
        )
        let arrowBarbLength = lineSegmentLength * arrowBarbLengthAsFractionOfSegmentLength
        let lineSegmentAngle = Math.atan2(
            vectorMagnitudeY,
            vectorMagnitudeX
        )

        let lineSegmentAngleTurned180 = lineSegmentAngle + Math.PI
        let arrowBarbAngleA = lineSegmentAngleTurned180 + arrowBarbAngle
        let arrowBarbAngleB = lineSegmentAngleTurned180 - arrowBarbAngle

        let arrowBarbAX = arrowHeadX + Math.cos(arrowBarbAngleA) * arrowBarbLength
        let arrowBarbAY = arrowHeadY + Math.sin(arrowBarbAngleA) * arrowBarbLength

        let arrowBarbBX = arrowHeadX + Math.cos(arrowBarbAngleB) * arrowBarbLength
        let arrowBarbBY = arrowHeadY + Math.sin(arrowBarbAngleB) * arrowBarbLength

        let lineWidth = Math.round(Math.sqrt(lineSegmentLength) * 2)

        ctx.beginPath()
        ctx.strokeStyle = strokeStyleString
        ctx.lineWidth = lineWidth
        ctx.moveTo(originX, originY)
        ctx.lineTo(arrowHeadX, arrowHeadY)

        ctx.moveTo(arrowBarbAX, arrowBarbAY)
        ctx.lineTo(arrowHeadX, arrowHeadY)
        ctx.lineTo(arrowBarbBX, arrowBarbBY)

        ctx.stroke()
    }
    static drawSphereNetForceVector(sphere){
        let x = sphere.x
        let y = sphere.y
        let fx = sphere.fnetx * 10E-2
        let fy = sphere.fnety * 10E-2
        let ctx = this.ctx

        this.drawVectorFromPoint(x, y, fx, fy, 'rgba(0, 255, 255, 0.2)')
    }
    static drawSphereVelocityVector(sphere){
        let x = sphere.x
        let y = sphere.y
        let vx = sphere.vx * 10E1
        let vy = sphere.vy * 10E1
        let ctx = this.ctx

        this.drawVectorFromPoint(x, y, vx, vy, 'rgba(255, 255, 0, 0.2)')
    }
    static drawAllSpheres(){
        let allIDs = Object.keys(Sphere.spheres)
        
        for (let id of allIDs){
            if (Input.showEffectToggleBooleans.tracesEffect){
                Draw.drawSpherePathTraceNoGradient(Sphere.spheres[id])
            }
            if (Input.showEffectToggleBooleans.areaEffect){
                Draw.drawSphereAreaTrace(Sphere.spheres[id])
            }
            
            Draw.drawSphere(Sphere.spheres[id])

            if (Input.showEffectToggleBooleans.velocityVectors){
                Draw.drawSphereVelocityVector(Sphere.spheres[id])
            }
            if (Input.showEffectToggleBooleans.forceVectors){
                Draw.drawSphereNetForceVector(Sphere.spheres[id])
            }
        }
        
    }
    static collisionEffectDrawChecker(effect){
        let delayFrames = effect.delayFrames
        let durationFrames = effect.durationFrames
        let currentFrame = effect.currentFrame

        if (delayFrames > 0){
            effect.delayFrames --
        }
        else{
            if (currentFrame <= durationFrames){
                this.drawCollisionEffect(effect)
            }
            else{
                effect.remove()
            }
        }
    }
    static drawCollisionEffect(effect){
        let sphere = effect.sphereAttachedTo
        let radiusScale = effect.radiusScale
        let durationFrames = effect.durationFrames
        let currentFrame = effect.currentFrame
        let ctx = this.ctx

        let currentEffectRadius = effect.r * radiusScale * currentFrame / durationFrames

        let effectAlpha = ( ( 1 + currentFrame) / durationFrames - 1 )**2

        ctx.globalAlpha = effectAlpha
        this.drawShockwaveEffect(sphere.x - effect.initialOffsetFromSphereX, sphere.y - effect.initialOffsetFromSphereY, currentEffectRadius, Draw.transparent, effect.color)
        ctx.globalAlpha = 1

        effect.currentFrame ++
    }
    static drawShockwaveEffect(x, y, radius, innerColor, outerColor){
        let ctx = this.ctx

        let gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

        gradient.addColorStop(0, innerColor)
        gradient.addColorStop(0.9, outerColor)
        gradient.addColorStop(1, innerColor)

        ctx.fillStyle = gradient
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.closePath()
        ctx.fill()
    }
    static drawAllEffects(){
        let allIDs = Object.keys(CollisionEffect.effects)
        
        for (let id of allIDs){
            Draw.collisionEffectDrawChecker(CollisionEffect.effects[id])

        }
        
    }
    static animationFrame(){
        Draw.ctx.clearRect(0,0,Draw.drawingCanvas.width, Draw.drawingCanvas.height)
        Draw.drawAllSpheres()
        Draw.drawAllEffects()
    }
}

class CollisionEffect {
    id
    sphereAttachedTo
    delayFrames
    durationFrames
    currentFrame
    radiusScale
    color
    x
    y
    r
    initialOffsetFromSphereX
    initialOffsetFromSphereY
    constructor(sphereAttachedTo, color, delayFrames, durationFrames, radiusScale = 1, x = sphereAttachedTo.x, y = sphereAttachedTo.y, r = sphereAttachedTo.r){

        if (Object.keys(CollisionEffect.effects).length >= CollisionEffect.maxEffectsInQueueBeforeDiscardingNewEvents){
            return
        }

        this.id = Utility.nextID
        this.color = color
        this.sphereAttachedTo = sphereAttachedTo
        this.delayFrames = delayFrames
        this.durationFrames = durationFrames
        this.radiusScale = radiusScale
        this.currentFrame = 0
        this.x = x
        this.y = y
        this.r = r
        this.initialOffsetFromSphereX = sphereAttachedTo.x - this.x
        this.initialOffsetFromSphereY = sphereAttachedTo.y - this.y
        CollisionEffect.effects[this.id] = this
    }
    static effects = {}
    static maxEffectsInQueueBeforeDiscardingNewEvents = 10

    remove(){
        delete CollisionEffect.effects[this.id]
    }

}
