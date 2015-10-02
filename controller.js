// params are theta_J used for jumping
// pred is the predicate of the function's target post condition
function mk_ctrl_f(params) {
  // default params for testing
  if (params.length == 6) {
    params  = [-0.00005, 0.00055, 0.000, 0.0]
  }
  // random params for seeding
  if (params.length == 0) {
    params = [ randR(-0.0005, 0.0005),
               randR(-0.0005, 0.0005),
               randR(-0.005, 0.005),
               randR(-0.6, 0.6)
             ]
  }
  var ctrl_f = {
    has_run : false,
    terminated : false,
    params : params,
    clear : function () {
      this.has_run = false
      this.terminated = false
    },
    spawn_child : function() {
      var delta_vect = [ randR(-0.0001, 0.0001),
                         randR(-0.0001, 0.0001),
                         randR(-0.001, 0.001),
                         randR(-0.06, 0.06)
                       ]
      var spawn_params = vadd(delta_vect, this.params)
      return mk_ctrl_f(spawn_params)
    },
    cross_over : function(other) {
      var ret_param = []
      for (var i = 0; i < this.params.length; i++) {
        if (Math.random() > 0.5) {
          ret_param.push(this.params[i])
        }
        else {
          ret_param.push(other.params[i])
        }
      }
      return mk_ctrl_f(ret_param)
    },
    // apply force and set terminate time
    apply_force : function (bodies) {
      var boxA = bodies[0]
      var abs_state = constraint_A.abstraction(bodies)
      // console.log("abs state ", abs_state)
      var action_state = [abs_state[0], abs_state[1], 1.0]
      var front_params = [this.params[0], this.params[1], this.params[2]]
      var force = {x: 0.0, y: vdot(front_params, action_state)}  
//      console.log("applying forcei ", force)
      // modify states
      Body.applyForce(boxA, boxA.position, force)
    },
    // given a state, what should I act on? state is given as engine.world.bodies
    act : function (bodies, time) {
      if (!this.has_run) {
        this.apply_force(bodies, time)
        this.has_run = true
      }
    },
    // a greedy algorithm that attempts to terminate closest to the first best state
    terminate : function (bodies) {
      if (!this.has_run) {return false}
      var y_velo = bodies[0].velocity.y
      if (y_velo > this.params[3] && this.has_run){
        this.terminated = true
        return true
      }
    }
  }
  return ctrl_f
}


// params are theta_J used for jumping
// pred is the predicate of the function's target post condition
function mk_ctrl_g(params, post_cond) {
  // default params for testing
  if (params.length == 6) {
    params  = [0.00045, -0.00005, 0.001, 0.000]
  }
  // random params for seeding
  if (params.length == 0) {
    params = [ randR(0, 0.001),
               randR(-0.0001, 0),
               randR(0, 0.01),
               randR(-0.01, 0.01)
             ]
  }
  var ctrl_g = {
    start_pos : null,
    last_score : -9999,
    has_run : false,
    terminated : false,
    post_cond : post_cond,
    params : params,
    clear : function () {
      this.start_pos = null
      this.last_score = -9999
      this.has_run = false
      this.terminated = false
    },
    spawn_child : function() {
      var delta_vect = [ randR(-0.0001, 0.0001),
                         randR(-0.0001, 0.0001),
                         randR(-0.001, 0.001),
                         randR(-0.001, 0.001)
                       ]
      var spawn_params = vadd(delta_vect, this.params)
      return mk_ctrl_g(spawn_params, post_cond)
    },
    cross_over : function(other) {
      var ret_param = []
      for (var i = 0; i < this.params.length; i++) {
        if (Math.random() > 0.5) {
          ret_param.push(this.params[i])
        }
        else {
          ret_param.push(other.params[i])
        }
      }
      return mk_ctrl_g(ret_param)
    },
    // apply force and set terminate time
    apply_force : function (bodies) {
      var boxA = bodies[0]
      var abs_state = mk_constraint_B([]).abstraction(bodies)
      // console.log("abs state ", abs_state)
      var action_state = [abs_state[0], abs_state[1], abs_state[2], 1.0]
      var force = {x: vdot(this.params, action_state), y: 0.0}  
      // modify states
      Body.applyForce(boxA, boxA.position, force)
    },
    // given a state, what should I act on? state is given as engine.world.bodies
    act : function (bodies, time) {
      if (!this.has_run) {
        this.start_pos = [bodies[0].position.x, bodies[0].position.y]
        this.apply_force(bodies, time)
        this.has_run = true
      }
    },
    // a greedy algorithm that terminates when x displacement is sufficiently close
    terminate : function (bodies) {
      if (!this.has_run) {return false}
      var boxAx = bodies[0].position.x
      var boxBx = bodies[1].position.x
      var boxAy = bodies[0].position.y
      var boxBy = bodies[1].position.y
      return boxAx - 100 > boxBx || boxAy - 200 > boxBy 
    }
  }
  return ctrl_g
}

function mk_ctrl_fg(ctrl_f, ctrl_g) {
  var ctrl_fg = {
    clear : function () {
      ctrl_f.clear()
      ctrl_g.clear()
    },
    act : function (bodies, time) {
      if (!ctrl_f.terminated) {
        ctrl_f.act(bodies, time)
      }
      if (ctrl_f.terminated && !ctrl_g.terminated) {
        ctrl_g.act(bodies, time)
      }
    },
    terminate : function (bodies) {
      if (!ctrl_f.terminated) {
        ctrl_f.terminate(bodies)
        return false
      }
      if (ctrl_f.terminated) {
        ctrl_g.terminate(bodies)
        return ctrl_g.terminated
      }
    }
  }
  return ctrl_fg
}
