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
