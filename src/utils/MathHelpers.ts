import {Stage} from "konva/types/Stage"
import {Coordinate} from "@/utils/types/GeometryTypes"

/**
 * Set Konva origin on center of stage
 *
 * @param stage
 */
export function setOriginOffset(stage: Stage | null) {
    if (stage) {
        stage.offsetX(stage.width() / 2)
        stage.offsetY(stage.height() / 2)
    }
}

/**
 * Get angle between to points
 *
 * @param pt1
 * @param pt2
 * @return number
 */
export function getAngleBetweenPoints(pt1: Coordinate, pt2: Coordinate): number {
    let angle = Number(Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x) * 180 / Math.PI) + 90
    // prevent sharp angles
    if (angle > 180) {
        angle = angle - 180
    } else if (angle < -180) {
        angle = angle + 180
    }
    return angle
}
