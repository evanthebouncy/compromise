var null_ctrl = {
  clear : function(){},
  act : function(world_objs) {
  },
  terminate : function(bodies) {}
}

// gradually move the arm in the intended direction
// returns true if sufficiently close
function set_arm$ (world_objs, l1, l2) {
  safety_bound = [100, 400]
  // add safety constraints so we don't exploded our arm
  l1 = Math.min(Math.max(l1, safety_bound[0]), safety_bound[1])
  l2 = Math.min(Math.max(l2, safety_bound[0]), safety_bound[1])
  var mus1 = world_objs.arm_mus1
  var mus2 = world_objs.arm_mus2
  if (mus1.length > l1) {
    mus1.length -= 1
  } else {
    mus1.length += 1
  }
  if (mus2.length > l2) {
    mus2.length -= 1
  } else {
    mus2.length += 1
  }

  if (Math.abs(l1 - mus1.length) < 2 && Math.abs(l2 - mus2.length) < 2){
    return true
  } else {
    return false
  }
}

var rand_ctrl = { 
  goal1 : randI(200, 400),
  goal2 : randI(200, 400),
  clear : function(){},
  act : function(actuators, perceptions) {
    var mus1 = actuators[0]
    var mus2 = actuators[1]
    console.log(this.goal1)
    if (Math.abs(mus1.length - this.goal1) < 5 &&  
        Math.abs(mus2.length - this.goal2) < 5) {
      this.goal1 = randI(200, 400)
      this.goal2 = randI(200, 400)
    } else {
      if (mus1.length > this.goal1) {
        mus1.length -= 1
      } else {
        mus1.length += 1
      }
      if (mus2.length > this.goal2) {
        mus2.length -= 1
      } else {
        mus2.length += 1
      }
    }
  },
  terminate : function(bodies) {return false}
}

var test_f1 = {
  theta : [-0.4, 100, -0.4, 200],
  clear : function() {},
  act : function(actuators, perceptions) {
    var box_x = perceptions.boxv1.position.x
    var l1 = box_x * this.theta[0] + this.theta[1]
    var l2 = box_x * this.theta[2] + this.theta[3]
    set_arm(actuators, l1, l2)
  },
  terminate : function(things) {return false}
}

function make_fAB(theta) {
  var f_AB = {
    clear : function() {
      this.has_put = false
      this.has_term = false
    },
    has_put : false,
    has_term : false,
    act : function(world_objs, A, B) {
      if (! this.has_put){
        var target_x = (B.box_down_x[0] + B.box_down_x[1]) * 0.5
        // var target_y = B.box_yy
        var l1 = target_x * theta[0] + theta[1]
        var l2 = target_x * theta[2] + theta[3]
        var arm_is_set = set_arm$(world_objs, l1, l2)
        if (arm_is_set) {
          ungrasp$ (world_objs)
          this.has_put = true
        }
      } else {
        var arm_is_returned = set_arm$(world_objs, mus1_l, mus2_l)
        if (arm_is_returned) {
          self.has_term = true
        }
      }
    },
    terminate : function(things) {
      return self.has_term
    }
  }

  return f_AB
}

