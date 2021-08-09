import {Coordinate} from "./types/GeometryTypes"
import {PathBuilder} from "@/utils/PathBuilder"
import Konva from "konva"
import {Path} from "konva/types/shapes/Path"
import {drivingSpeed, pixelMeterRation} from "@/config"

export class Router {

    private readonly columnWidth: number
    private readonly rowHeight: number
    private readonly columnDriveWayFactor: number
    private readonly rowDriveWayFactor: number
    private readonly radius: number

    constructor(
        columnWidth = 400,
        rowHeight = 200,
        columnDriveWayFactor = 0.4,
        rowDriveWayFactor = 0.5,
        radius = 50
    ) {
        this.columnWidth = columnWidth
        this.rowHeight = rowHeight
        this.columnDriveWayFactor = columnDriveWayFactor
        this.rowDriveWayFactor = rowDriveWayFactor
        this.radius = radius
    }

    /**
     * Calculate SVG path between two coordinates
     * @param from
     * @param to
     */
    public getSvgPath(from: Coordinate, to: Coordinate) {

        let pathBuilder = new PathBuilder()
        pathBuilder.moveTo(from)

        let diffX = to.x - from.x // > 0 = to right
        let hDirection = diffX >= 0 ? 1 : -1
        let diffY = to.y - from.y // > 0 = downwards
        let vDirection = diffY >= 0 ? 1 : -1
        let sameY = from.y === to.y ? -1 : 1

        /**
         * Move in straight line
         */
        if (diffY === 0 && Math.abs(diffX) <= this.columnWidth) {
            pathBuilder.lineTo(to)
        } else {

            /**
             * Move within one column
             */
            let lastCornerPos: Coordinate
            if (Math.abs(diffX) <= this.columnWidth) {
                let firstX = from.x + this.columnWidth * this.columnDriveWayFactor * hDirection
                // chose different sides for up and down
                if (from.x === to.x) firstX = from.x + this.columnWidth * this.columnDriveWayFactor * hDirection * vDirection
                let firstCornerPos = {
                    x: firstX,
                    y: from.y
                }
                let firstStop = {
                    x: firstCornerPos.x,
                    y: firstCornerPos.y + (this.radius + 1) * vDirection * sameY
                }
                // 1. move out of station with first curve
                pathBuilder.roundedCorner(firstCornerPos, firstStop, this.radius)
                // define last point
                lastCornerPos = {
                    x: firstStop.x,
                    y: to.y
                }
            }
            /**
             * Move across columns
             */
            else {
                // 1. move out of station with first curve
                let firstCornerPos = {
                    x: from.x + this.columnWidth * this.columnDriveWayFactor * hDirection, // leave station
                    y: from.y
                }
                let firstStop = {
                    x: firstCornerPos.x,
                    y: firstCornerPos.y + (this.radius + 1) * vDirection * sameY
                }
                pathBuilder.roundedCorner(firstCornerPos, firstStop, this.radius)
                let horizontalPathY = to.y - this.rowHeight * this.rowDriveWayFactor * vDirection

                // 2. move to second stop
                let secondCornerPos = {
                    x: firstStop.x,
                    y: horizontalPathY
                }
                let secondStop = {
                    x: secondCornerPos.x + (this.radius + 1) * hDirection,
                    y: secondCornerPos.y
                }
                pathBuilder.roundedCorner(secondCornerPos, secondStop, this.radius)
                // 3. move to third stop
                let thirdCornerPos = {
                    x: to.x - this.columnWidth * this.columnDriveWayFactor * hDirection,
                    y: secondCornerPos.y
                }
                let thirdStop = {
                    x: thirdCornerPos.x,
                    y: thirdCornerPos.y + (this.radius + 1) * vDirection
                }
                pathBuilder.roundedCorner(thirdCornerPos, thirdStop, this.radius)
                // 4. move into station with last curve
                lastCornerPos = {
                    x: thirdStop.x,
                    y: to.y
                }
            }
            // move to final stop
            pathBuilder.roundedCorner(lastCornerPos, to, this.radius)
        }
        return pathBuilder.path
    }

    /**
     * Create Konva Path instance
     * @param from
     * @param to
     */
    public getKonvaPath(from: Coordinate, to: Coordinate): Path {
        let pathData = this.getSvgPath(from, to)
        return new Konva.Path({data: pathData})
    }

    /**
     * Estimate transportation time between two coordinates
     * @param path
     */
    public getTransportationDuration(path: Path): number {
        let distanceInPixel = path.getLength() // in px
        let distanceInMeter = distanceInPixel / pixelMeterRation // in m
        return distanceInMeter / drivingSpeed
    }
}
