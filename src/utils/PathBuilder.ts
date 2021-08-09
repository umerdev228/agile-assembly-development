import {Coordinate} from "@/utils/types/GeometryTypes"

/**
 * SVG Path Builder
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
 * L = Line to
 * M = Move to
 * Q = Quadratic curve
 */
export class PathBuilder {
    path: string = ''
    private currentPosition: Coordinate = {x: 0, y: 0}

    moveTo(position: Coordinate) {
        this.currentPosition = position
        this.path += `M${position.x} ${position.y}`
    }

    lineTo(position: Coordinate) {
        this.currentPosition = position
        this.path += `L${position.x} ${position.y}`
    }

    quadraticCurve(control: Coordinate, end: Coordinate) {
        this.path += `Q${control.x} ${control.y} ${end.x} ${end.y}`
        this.currentPosition = end
    }

    extendQuadraticCurve(end: Coordinate) {
        this.path += `T${end.x} ${end.y}`
        this.currentPosition = end
    }

    /**
     * Draw a rounded corner with given radius
     * @param corner
     * @param to
     * @param radius
     */
    roundedCorner(corner: Coordinate, to: Coordinate, radius: number = 10) {
        let curveStart: Coordinate
        let curveEnd: Coordinate
        // check direction
        let isLeftToRight = to.x > this.currentPosition.x
        let isTopToBottom = to.y > this.currentPosition.y
        if (corner.y === this.currentPosition.y) {
            // ---| curve
            // curve start
            if (isLeftToRight) curveStart = { x: corner.x - radius, y: corner.y }
            else curveStart = { x: corner.x + radius, y: corner.y }
            // curve end
            if (isTopToBottom) curveEnd = { x: corner.x, y: corner.y + radius }
            else curveEnd = { x: corner.x, y: corner.y - radius }
        } else if (corner.x === this.currentPosition.x) {
            // |--- curve
            // curve start
            if (isTopToBottom) curveStart = { x: corner.x, y: corner.y - radius }
            else curveStart = { x: corner.x, y: corner.y + radius }
            // curve end
            if (isLeftToRight) curveEnd = { x: corner.x + radius, y: corner.y }
            else curveEnd = { x: corner.x - radius, y: corner.y }
        } else {
            return new Error('Cannot resolve curve')
        }
        this.lineTo(curveStart)
        this.quadraticCurve(corner, curveEnd)
        this.lineTo(to)
    }
}
