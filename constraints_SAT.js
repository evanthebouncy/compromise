// there are 3 possible abstractions for our world
// in the world state, everything is concrete
// in the abstract state, the world state is summarized, possibly losing information
// in the constraint state, the abstract state is passed through a constraint

// The precondition A
var constraint_A = {
  // abstract state is of form [deltaX, deltaY] between boxB and boxA
  abstraction : function (bodies) {
    var boxA = bodies[0]
    var boxB = bodies[1]
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    return [xy.x, xy.y]
  },
  
  // concretize is the "inverse" of abstraction
  concretize : function(abs_vect) {
    var aX = 50
    var aY = 590
    var boxA = Bodies.rectangle(aX, aY, 50, 50, {restitution: 0.3});
    var bX = abs_vect[0] + aX
    var bY = abs_vect[1] + aY
    var boxB = Bodies.rectangle(bX, bY, 50, 50, {isStatic:true});
    var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    return [boxA, boxB, ground]
  },

  // params are height_diff and side_diff
  w_diff_range : [100, 200],
  h_diff_range : [200, 400],
  
  // a predicate is a function to decide of an abstract state sat the predicate
  sat : function(abs_vect) {
    if (in_rng(abs_vect[0], this.w_diff_range) && in_rng(-1*abs_vect[1], this.h_diff_range)) {
      return 1
    } else {
      return 0
    }
  },
  // a function to create a sample point in an abstract state
  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = -1 * randI(this.h_diff_range[0], this.h_diff_range[1])
    var ret = [diffX, diffY]
    return ret
  },
  // a function to return a concret sample
  concrete_sample : function() {
    var abs_state = this.sample()
    // console.log("satisfied? ", this.sat(abs_state))
    return this.concretize(abs_state)
  }
}


// the middle condition B
function mk_constraint_B(params) {
  if (params.length == 6) {
    params = [-0.5, 0.5, -3.7, 3.7]
  }
  if (params.length == 0) {
    var slop1 = randR(-0.7, 0.7)
    var slop2 = randR(-0.7, 0.7)
    var speed1 = randR(-5.0, 5.0)
    var speed2 = randR(-5.0, 5.0)
    params = [ Math.min(slop1, slop2),
               Math.max(slop1, slop2),
               Math.min(speed1, speed2),
               Math.max(speed1, speed2)
             ]
  }
  var constraint_B = {
    // the offset that's a constant for now
    gap : 50,
    // params are height_diff and side_diff
    w_diff_range : [100, 200],
    // param the same as in the argument
    params : params,
    // abstract state is of form [deltaX, deltaY, a.y_velocity] between boxB and boxA
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
    },

    sat : function(state_B_vect) {
      var diffX = state_B_vect[0]
      var diffY1 = this.params[0] * diffX + this.gap
      var diffY2 = this.params[1] * diffX + this.gap
      var velo_y_range = [this.params[2], this.params[3]]
      if (in_rng(state_B_vect[1], [diffY1, diffY2]) &&
          in_rng(state_B_vect[2], velo_y_range)) {
        return 1.0
      } else {
        return 0
      }
    },

    sample : function() {
      var params = this.params
      var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
      var diffY1 = params[0] * diffX + this.gap
      var diffY2 = params[1] * diffX + this.gap
      var diffY = randR(diffY1, diffY2)
      var veloY = randR(params[2], params[3])
      return [diffX, diffY, veloY]
    },
    
    concrete_sample : function() {
      var abs_state = this.sample()
      // console.log("satiesfied? ", this.sat(abs_state))
      return this.concretize(abs_state)
    },

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
      return mk_constraint_B(spawn_params)
    },

    cross_over : function (other) {
      var ret_param = []
      for (var i = 0; i < this.params.length; i++) {
        if (Math.random() > 0.5) {
          ret_param.push(this.params[i])
        } 
        else {
          ret_param.push(other.params[i])
        }
      }
      return mk_constraint_B(ret_param)
    }
    
  }
  return constraint_B
}

// for the postcondition C
// abstract state is of the form [deltaX, deltaY, a.velocity] 
var constraint_C = {

  w_diff_range : [0, 10],
  h_diff_range : [50, 52],
  v_diff_range : [-0.1, 0.1],
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
  },

  // params are height_diff and side_diff
  sat : function(state_C_vect) {
    var satt = in_rng(state_C_vect[0], this.w_diff_range) && 
               in_rng(state_C_vect[1], this.h_diff_range) &&
               in_rng(state_C_vect[2], this.v_diff_range) &&
               in_rng(state_C_vect[3], this.v_diff_range)
    if (satt) {return 1.0} else {return 0.0}
  },

  sample : function() {
    var diffX = randI(this.w_diff_range[0], this.w_diff_range[1])
    var diffY = randI(this.h_diff_range[0], this.h_diff_range[1])
    var veloX = randR(this.v_diff_range[0], this.v_diff_range[1])
    var veloY = randR(this.v_diff_range[0], this.v_diff_range[1])
    return [diffX, diffY, veloX, veloY]
  },

  concrete_sample : function() {
    var abs_state = this.sample()
    console.log("satiesfied? ", this.sat(abs_state))
    return this.concretize(abs_state)
  }
  
}


