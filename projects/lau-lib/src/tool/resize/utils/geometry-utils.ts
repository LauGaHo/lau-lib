export default class GeometryUtils {

  /**
   * 获取两个点的中心点
   * @param p1
   * @param p2
   */
  static getCenterPoint(p1: { x: number, y: number }, p2: { x: number, y: number }) {
    return {
      x: p1.x + ((p2.x - p1.x) / 2),
      y: p1.y + ((p2.y - p1.y) / 2),
    }
  }

}
