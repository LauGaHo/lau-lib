export default class MathUtils {

  /**
   * 计算根据圆心旋转后的点的坐标（本质是线性代数的二维变换）
   * @param point 点坐标
   * @param center 旋转中心
   * @param rotate 旋转角度
   */
  static calculateRotatedPointCoordinate(point: { x: number, y: number },
                                         center: { x: number, y: number },
                                         rotate: number) {
    return {
      x: (point.x - center.x) * Math.cos(MathUtils.angleToRadian(rotate)) - (point.y - center.y) * Math.sin(MathUtils.angleToRadian(rotate)) + center.x,
      y: (point.x - center.x) * Math.sin(MathUtils.angleToRadian(rotate)) + (point.y - center.y) * Math.cos(MathUtils.angleToRadian(rotate)) + center.y,
    }
  }

  /**
   * 角度和弧度互换
   * @param deg
   */
  static angleToRadian(deg: number) {
    return deg * Math.PI / 180;
  }

}
