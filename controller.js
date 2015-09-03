// params are theta_J used for jumping
// pred is the predicate of the function's target post condition
function mk_ctrl_f(params, post_cond) {
  // default params for testing
  if (params.length == 0) {
    params  = [-0.0005, 0.0005, 0.000]
  }
  var ctrl_f = {
    last_score : -9999,
    has_run : false,
    post_cond : post_cond,
    params : params,
    clear : function () {
      this.has_run = false
    },
    // apply force and set terminate time
    apply_force : function (bodies) {
      console.log("applying force")
      var boxA = bodies[0]
      var boxB = bodies[1]
      var abs_state = abstract_state_A.abstraction(boxA, boxB)
      console.log("abs state ", abs_state)
      var action_state = [abs_state[0], abs_state[1], 1.0]
      var force = {x: 0.0, y: vdot(this.params, action_state)}  
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
      var boxA = bodies[0]
      var boxB = bodies[1]
      var abs_state = abstract_state_B.abstraction(boxA, boxB)
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
