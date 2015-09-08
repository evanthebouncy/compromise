// ulilities
function range(start, end) {
  var foo = [];
  for (var i = start; i <= end; i++) {
      foo.push(i);
  }
  return foo;
}

function in_rng(x,rng) {
  return rng[0] <= x && x <= rng[1]
}

function soft_in_rng(x,rng) {
  if (in_rng(x, rng)) {
    return 1.0
  } else {
    return 1.0 / (1 +
        Math.min(Math.abs(x-rng[0]), Math.abs(x-rng[1]))
      )
  }
}

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

function vadd(vx, vy) {
  ret = []
  for (var i = 0; i < vx.length; i++) {
    ret.push(vx[i] + vy[i])
  }
  return ret
}

function mag(v) {
  ret = 0
  for (var i = 0; i < v.length; i++) {
    ret += v[i] * v[i]
  }
  return Math.sqrt(ret)
}
