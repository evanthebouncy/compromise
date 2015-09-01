// params are theta_J used for jumping 3 dimensions
// and theta_T used for timing 3 more dimensions
// pred is the predicate of the function's target post condition
function mk_ctrl_f(params, pred) {
  // default params for testing
  if (params.length == 0) {
    params  = [0.0001, 0.0003, 0.000, -0.9, -0.9, 1.0]
  }
  var ctrl_f = {
    term_time : 0,
    has_run : false,
    pred : pred,
    params : params,
    clear : function () {
      this.term_time = 0
      this.has_run = false
    },
    // apply force and set terminate time
    apply_force : function (bodies, time) {
      var boxA = bodies[0]
      var boxB = bodies[1]
      var abs_state = abstract_state_A.abstraction(boxA, boxB)
      var action_state = [abs_state[0], abs_state[1], 1.0]
      var th_J = [this.params[0], this.params[1], this.params[2]]
      var th_T = [this.params[3], this.params[4], this.params[5]]
      var force = {x: 0.0, y: vdot(th_J, action_state)}  
      console.log("paramz ", this.params, params)
      console.log(action_state, th_J, force)
      var delay = vdot(th_T, action_state)
      // modify states
      Body.applyForce(boxA, boxA.position, force)
      this.term_time = time + delay
    },
    // given a state, what should I act on? state is given as engine.world.bodies
    act : function (bodies, time) {
      if (!this.has_run) {
        this.apply_force(bodies, time)
        this.has_run = true
      }
    },
    // given a state, terminate myself if either termination condition meet or timeout
    terminate : function (bodies, time) {
      var boxA = bodies[0]
      var boxB = bodies[1]
      var abs_state = abstract_state_B.abstraction(boxA, boxB)
      if (this.pred.sat(abs_state)) {
        return true
      }
      if (this.has_run && this.term_time < time) {
        return true
      }
      return false
    } 
  }
  return ctrl_f
}
