function randI(a,b) {
  return Math.floor((Math.random() * (b-a)) + a);
}

function randR(a,b) {
  return Math.random() * (b-a) + a;
}

function vdot(vx, vy) {
  var ret = 0.0
  for (i = 0; i < vx.length; i++) {
    ret += vx[i] * vy[i]
  }
  return ret
}

var CTRL = {
  run : function(boxA, boxB, time) {
    var f_finished = CTRL_F.run(boxA, boxB, time)
    if (f_finished) {
      var g_finished = CTRL_G.run(boxA, boxB, time)
    }
  }
}

var CTRL_F = {
  start_time : 0,
  end_time : 0,

  f_params : {
    th_x : [0.00005, 0.00,   0.00],
    th_y : [0.00,   0.0003, 0.0],
    th_t : [0.0,    -1.1,    0.0]
  },

  // from boxA and boxB extract the state
  f_state : function(boxA, boxB) {
    console.log("f state", boxA, boxB);
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    return [xy.x, xy.y, 1.0]
  },

  // gives a force based on f_param
  f_force : function(state) {
    var f_x = vdot(this.f_params.th_x, state)
    var f_y = vdot(this.f_params.th_y, state)
    return {x: f_x, y: f_y}  
  },
  
  // gives a delay based on f_param
  f_delay : function(state) {
    var ret = vdot(this.f_params.th_t, state)
    return ret
  },

  run : function(boxA, boxB, time) {
    if (this.start_time == 0){
      this.start_time = time
    }
    if (this.end_time == 0) {
      // console.log("applying force!")
      var stateA = this.f_state(boxA, boxB)
      var forceA = this.f_force(stateA)
      var delayF = this.f_delay(stateA)
      // console.log("state ", stateA, "force ", forceA, "delay ", delayF)
      console.log("sat? ", predicate_A.sat(abstract_A(boxA, boxB)))
      Body.applyForce(boxA, boxA.position, forceA)
      this.end_time = this.start_time + delayF
    }
    if (this.end_time < time) {
      return true;
    }
    return false;
  }
  
}

var CTRL_G = {
  start_time : 0,
  end_time : 0,

  f_params : {
    th_x : [0.0002, 0.00,   0.00],
    th_y : [0.00,   0.00045, 0.0],
    th_t : [0.0,    -1.1,    0.0]
  },

  // from boxA and boxB extract the state
  f_state : function(boxA, boxB) {
    console.log("f state", boxA, boxB);
    var xy = Matter.Vector.sub(boxB.position, boxA.position)
    return [xy.x, xy.y, 1.0]
  },

  // gives a force based on f_param
  f_force : function(state) {
    var f_x = vdot(this.f_params.th_x, state)
    var f_y = vdot(this.f_params.th_y, state)
    return {x: f_x, y: f_y}  
  },
  
  // gives a delay based on f_param
  f_delay : function(state) {
    var ret = vdot(this.f_params.th_t, state)
    return ret
  },

  run : function(boxA, boxB, time) {
    if (this.start_time == 0){
      this.start_time = time
    }
    if (this.end_time == 0) {
      // console.log("applying force!")
      var stateA = this.f_state(boxA, boxB)
      var forceA = this.f_force(stateA)
      var delayF = this.f_delay(stateA)
      // console.log("state ", stateA, "force ", forceA, "delay ", delayF)
      Body.applyForce(boxA, boxA.position, forceA)
      this.end_time = this.start_time + delayF
    }
    if (this.end_time < time) {
      return true;
    }
    return false;
  }
  
}

function clearCTRL() {
  CTRL_F.start_time = 0
  CTRL_F.end_time = 0
  CTRL_G.start_time = 0
  CTRL_G.end_time = 0
}
