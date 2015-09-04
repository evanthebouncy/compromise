// params are theta_J used for jumping
// pred is the predicate of the function's target post condition
function mk_ctrl_f(params, post_cond) {
  // default params for testing
  if (params.length == 6) {
    params  = [-0.00005, 0.00055, 0.000]
  }
  // random params for seeding
  if (params.length == 0) {
    params = [ randR(-0.0005, 0.0005),
               randR(-0.0005, 0.0005),
               randR(-0.005, 0.005)
             ]
  }
  var ctrl_f = {
    last_score : -9999,
    has_run : false,
    post_cond : post_cond,
    params : params,
    clear : function () {
      this.last_score = -9999
      this.has_run = false
    },
    spawn_child : function() {
      var delta_vect = [ randR(-0.00001, 0.00001),
                         randR(-0.00001, 0.00001),
                         randR(-0.0001, 0.0001)
                       ]
      var spawn_params = vadd(delta_vect, this.params)
      return mk_ctrl_f(spawn_params, post_cond)
    },
    // apply force and set terminate time
    apply_force : function (bodies) {
      var boxA = bodies[0]
      var abs_state = abstract_state_A.abstraction(bodies)
      // console.log("abs state ", abs_state)
      var action_state = [abs_state[0], abs_state[1], 1.0]
      var force = {x: 0.0, y: vdot(this.params, action_state)}  
      // console.log("applying forcei ", force)
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
      var abs_state = abstract_state_B.abstraction(bodies)
      // keep track of scores, return as soon as it decreases
      var cur_score = this.post_cond.soft_sat(abs_state)
      if (cur_score < this.last_score) {
        return true
      } else {
        this.last_score = cur_score
        return false
      }
    }
  }
  return ctrl_f
}
