var null_ctrl = {
  clear : function(){},
  act : function(world_objs) {
  },
  terminate : function(bodies) {}
}

function set_arm (mus, l1, l2) {
  safety_bound = [100, 400]
  // add safety constraints so we don't exploded our arm
  l1 = Math.min(Math.max(l1, safety_bound[0]), safety_bound[1])
  l2 = Math.min(Math.max(l2, safety_bound[0]), safety_bound[1])
  var mus1 = mus[0]
  var mus2 = mus[1]
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

var f_AB = {
  theta : [0, 150, 0, 400],
  clear : function() {},
  act : function(actuators, perceptions, pre_cond, post_cond) {
    var box_x = 0.5 * (post_cond.box_down_x[0] + post_cond.box_down_x[1])
    var l1 = box_x * this.theta[0] + this.theta[1]
    var l2 = box_x * this.theta[2] + this.theta[3]
    set_arm(actuators, l1, l2)
    if (post_cond.poschecks(perceptions)){
      ungrasp(actuators[2])
    }
  },
  terminate : function(things) {return false}
}


