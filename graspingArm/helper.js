var static_count = 0

function all_static(world_objs) {
  for (var i = 0; i < world_objs.length; i++) {
    if (world_objs[i].speed > 1) {
      console.log(world_objs[i].speed)
      console.log(world_objs[i].force)
      static_count = 0
      return false
    }
  }
  static_count += 1
  return static_count > 10
}

// base_jt, hand_pos both x,y tuples
// bone_l the length of both arm and forearm bone
function find_elbow(base_jt, hand_pos, bone_l) {
  var half_der1 = vscale(vsub(hand_pos, base_jt), 0.5)
  var mag_der2 = Math.sqrt(Math.pow(bone_l, 2) - Math.pow(mag(half_der1),2))
  var der2 = [-half_der1[1], half_der1[0]]
  var der2_unit = vscale(der2, 1 / mag(der2))
  var go_der2 = vscale(der2_unit, mag_der2)
  return vadd(vadd(base_jt, half_der1), go_der2)
}
