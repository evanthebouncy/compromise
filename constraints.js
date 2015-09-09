// there are 3 possible abstractions for our world
// in the world state, everything is concrete
// in the abstract state, the world state is summarized, possibly losing information
// in the constraint state, the abstract state is passed through a constraint

// for the precondition A

// abstract state is of form [deltaX, deltaY] between boxB and boxA
var abstract_state_A = {
  abstraction : function (bodies) {
    var boxA = bodies[0]
    var boxB = bodies[1]
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    return [xy.x, xy.y]
  },

  concretize : function(abs_vect) {
    var aX = 50
    var aY = 590
    var boxA = Bodies.rectangle(aX, aY, 50, 50, {restitution: 0.3});
    var bX = abs_vect[0] + aX
    var bY = abs_vect[1] + aY
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}
// a predicate is actually an object with a function to decide of an abstract state
// meets the predicate, and a function to create a sample point in an abstract state
var predicate_A = {
  // params are height_diff and side_diff
  w_diff_range : [100, 200],
  h_diff_range : [200, 400],
  
  sat : function(abs_vect) {
    return in_rng(abs_vect[0], this.w_diff_range) && in_rng(-1*abs_vect[1], this.h_diff_range)
  },

  soft_sat : function(vect) {
    return Math.min (soft_in_rng(abs_vect[0], this.w_diff_range), 
                     soft_in_rng(-1 * abs_vect[1], this.h_diff_range)
                    )
  },

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = -1 * randI(this.h_diff_range[0], this.h_diff_range[1])
    return [diffX, diffY]
  }
}


// for the condition B

// abstract state is of form [deltaX, deltaY, a.y_velocity] between boxB and boxA
var abstract_state_B = {
  abstraction : function(bodies) {
    var boxA = bodies[0]
    var boxB = bodies[1]
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    var y_velocity = boxA.velocity.y
    return [xy.x, xy.y, y_velocity]
  },

  concretize : function (state_B_vect) {
    var aX = 50
    var aY = 250
    var boxA = Bodies.rectangle(aX, aY, 50, 50, {restitution: 0.3});
    Body.setVelocity(boxA, {x: 0.0, y: state_B_vect[2]})
    var bX = state_B_vect[0] + aX
    var bY = state_B_vect[1] + aY
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}

// make predicate b
function mk_pred_B(params) {
  if (params.length == 6) {
    params = [0.2, 0.5, -3.7, 0.0]
  }
  if (params.length == 0) {
    var slop1 = randR(-0.1, 0.5)
    var slop2 = randR(-0.5, 0.5)
    var speed1 = randR(-5.0, 5.0)
    var speed2 = randR(-5.0, 5.0)
    params = [ Math.min(slop1, slop2),
               Math.max(slop1, slop2),
               Math.min(speed1, speed2),
               Math.max(speed1, speed2)
             ]
  }
  var predicate_B = {
    // the offset that's a constant for now
    gap : 60,
    // params are height_diff and side_diff
    w_diff_range : [100, 200],
    // this param is the diff multiplier, 
    // diff bound,
    // and the y_velocity_bounds
    params : params,

    spawn_child : function() {
      var delta_vect = [ randR(-0.05, 0.05),
                         randR(-0.05, 0.05),
                         randR(-0.5, 0.5),
                         randR(-0.5, 0.5)
                       ]
      var spawn_params = vadd(delta_vect, this.params)
      if (spawn_params[0] > spawn_params[1]){
        var meow1 = spawn_params[0]
        var meow2 = spawn_params[1]
        spawn_params[0] = Math.min(meow1, meow2)
        spawn_params[1] = Math.max(meow1, meow2)
      }
      if (spawn_params[2] > spawn_params[3]){
        var meow1 = spawn_params[2]
        var meow2 = spawn_params[3]
        spawn_params[2] = Math.min(meow1, meow2)
        spawn_params[3] = Math.max(meow1, meow2)
      }
      return mk_pred_B(spawn_params)
    },
    
    sat : function(state_B_vect) {
      var params = this.params
      var diffX = Math.abs(state_B_vect[0])
      var diffY = params[0] * diffX + this.gap
      var h_diff_range = [diffY - 0.1, diffY + 0.1]
      var velo_y_range = [params[1], params[2]]
      return in_rng(state_B_vect[1], h_diff_range) && 
             in_rng(state_B_vect[2], velo_y_range)
    },

    soft_sat : function(state_B_vect) {
      var params = this.params
      var diffX = state_B_vect[0]
      var diffY1 = params[0] * diffX + this.gap
      var diffY2 = params[1] * diffX + this.gap
      var velo_y_range = [params[1], params[2]]
      return soft_in_rng(state_B_vect[1], [diffY1, diffY2]) *
             soft_in_rng(state_B_vect[2], velo_y_range)
    },

    sample : function() {
      var params = this.params
      var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
      var diffY1 = params[0] * diffX + this.gap
      var diffY2 = params[1] * diffX + this.gap
      var diffY = randR(diffY1, diffY2)
      var veloY = randR(params[2], params[3])
      return [diffX, diffY, veloY]
    }
  }
  return predicate_B
}

// for the postcondition C

// abstract state is of the form [deltaX, deltaY, a.velocity] 
var abstract_state_C = {
  abstraction : function(bodies) {
    var boxA = bodies[0]
    var boxB = bodies[1]
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    var velocity = boxA.velocity
    return [xy.x, xy.y, velocity.x, velocity.y]
  },

  concretize : function(state_C_vect) {
    var boxA = Bodies.rectangle(400, 300, 50, 50, {restitution: 0.3});
    Body.setVelocity(boxA, {x: state_C_vect[2], y: state_C_vect[3]})
    var bX = state_C_vect[0] + 400
    var bY = state_C_vect[1] + 300
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  }
}
var predicate_C = {
  // params are height_diff and side_diff
  w_diff_range : [-2, 2],
  h_diff_range : [50, 52],
  v_diff_range : [-0.1, 0.1],
  
  sat : function(state_C_vect) {
    return in_rng(state_B_vect[0], w_diff_range) && 
           in_rng(state_B_vect[1], h_diff_range) &&
           in_rng(state_B_vect[2], v_diff_range) &&
           in_rng(state_B_vect[3], v_diff_range)
  },

  soft_sat : function(state_C_vect) {
    return soft_in_rng(state_C_vect[0], this.w_diff_range) *
           soft_in_rng(state_C_vect[1], this.h_diff_range) *
           soft_in_rng(state_C_vect[2], this.v_diff_range) *
           soft_in_rng(state_C_vect[3], this.v_diff_range)
           
//    return Math.min( soft_in_rng(state_C_vect[0], this.w_diff_range),
//                     soft_in_rng(state_C_vect[1], this.h_diff_range),
//                     soft_in_rng(state_C_vect[2], this.v_diff_range),
//                     soft_in_rng(state_C_vect[3], this.v_diff_range)
//            )
  },

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = randI(this.h_diff_range[0], this.h_diff_range[1])
    var veloX = randR(this.v_diff_range[0], this.v_diff_range[1])
    var veloY = randR(this.v_diff_range[0], this.v_diff_range[1])
    return [diffX, diffY, veloX, veloY]
  }
}


