// create a measurer for fitness, generate a fixed number of test cases
// this should be deterministic
function mk_measurer (pre, post, test_n) {
  var test_cases = []
  // huge bug fix, we gotta push the non-concretized version,
  // the conc version is modified during simulation causing bugs
  for (var i = 0; i < test_n; i++) {
    test_cases.push(pre.sample())
  }
  function get_test_score(bodies) {
    var abstr_state = post.abstraction(bodies)
    return post.sat(abstr_state)
  }
  // given a controller, measure how good it is
  function measure(ctrl) {
    var ret = 0.0
    for (var i = 0; i < test_n; i++) {
      var init_s = test_cases[i]
      var init_state = pre.concretize(init_s)
      var final_state = simulate(init_state, ctrl, 5000)
      ret += get_test_score(final_state)
    }
    return ret
  } 
  return measure
}

// genetic algorithm to train an object
// takes as input a maker to spawn objects, a measure to measure fitness
// and some hyper-parameters
function train(obj_mkr, measure, pool_size, num_gen, seed) {
  var spawn_num = 1
  var pool = []
  if (seed != null) {pool.push(seed)}
  var big_pool_fitness = []
  // populate the pool of random controllers
  for (var i = 0; i < pool_size; i++) {
    pool.push(obj_mkr([])) 
  }
  // commence evolution
  // for num gen number of rounds
  for (var gen_i = 0; gen_i < num_gen; gen_i++) {
    console.log("generation: ", gen_i)
    console.log("pool ", _.map(pool, function(x){return x.params}))
    // make babies and measure fitness
    big_pool_fitness = []
    for (var i = 0; i < pool_size; i++) {
      var mom = pool[i]
      big_pool_fitness.push([measure(mom), mom])
      for (var j = 0; j < spawn_num; j++) {
        console.log("spawn n push")
        var child = mom.spawn_child()
        var other_rand = pool[randI(0, pool.length)]
        var crossed = child.cross_over(other_rand)
        big_pool_fitness.push([measure(crossed), crossed])
      }
    }
    console.log("big pool ", _.map(big_pool_fitness, function(x){return [x[0], x[1].params]}))
    big_pool_fitness.sort(fitness_sort_fun)
    big_pool_fitness.reverse()
    // survival of the top
    pool = []
    for (var k = 0; k < pool_size; k++) {
      pool.push(big_pool_fitness[k][1])
    }
    console.log("top fitness: ", measure(pool[0]), " params: ", pool[0].params)
    loggy("top fitness: " + measure(pool[0]) + " params: " + pool[0].params)
  }
  return pool[0]
}

// measure a middle constraint, this measure is by definition not deterministic
// as it needs to sample
function mk_measure_constraint(pre, post, ctrl_f, ctrl_g, test_n) {
  function measure(constraint_middle) {
    var score_first = 0.0
    var score_second = 0.0
    for (var i = 0; i < test_n; i++) {
      // get the first score
      var rand_state_a = pre.concrete_sample()
      var state_fa = simulate(rand_state_a, ctrl_f, 5000)
      score_first += constraint_middle.sat(constraint_middle.abstraction(state_fa))
      // get the second score
      var rand_state_b = constraint_middle.concrete_sample()
      var state_gb = simulate(rand_state_b, ctrl_g, 5000)
      score_second += post.sat(post.abstraction(state_gb))
    }
    return score_first * score_second / constraint_middle.area()
  }
  return measure
}

// measure match-ness of image
// higher score the better
// for this we want the "smallest" area that capture all of the image
function mk_match_measure_img(pre, ctrl_f, test_n) {
  function measure(constraint_middle) {
    var num_sat = 0
    for (var i = 0; i < test_n; i++) {
      var rand_state_a = pre.concrete_sample()
      var state_fa = simulate(rand_state_a, ctrl_f, 5000)
      num_sat += constraint_middle.sat(constraint_middle.abstraction(state_fa))
    }
    // if it contains all the points of the image, return -area (bigger value
    // better i.e smaller area) if it doesn't, it should be really bad
    return -100 * (test_n - num_sat) - constraint_middle.area()
  }
  return measure
}

// measure match-ness of pre-image
// higher score the better
// for this we want the "biggest" area that capture all of pre-image
function mk_match_measure_preimg(post, ctrl_g, test_n) {
  function measure(constraint_middle) {
    var num_sat = 0
    for (var i = 0; i < test_n; i++) {
      var rand_state_b = constraint_middle.concrete_sample()
      var state_gb = simulate(rand_state_b, ctrl_g, 5000)
      num_sat += post.sat(post.abstraction(state_gb))
    }
    // if it contains all pt of image, it's area, bigger better
    // else it gets heavily penalized by the number of unsat points
    return -100 * (test_n - num_sat) + constraint_middle.area()
  }
  return measure
}

// find a parameter in teh middle-constraint that is the smallest area
// that capture all of the image
function match_constraint_img(pre, ctrl_f, num_gen, seed) {
} 

function train_constraint(constr_mkr, pre, post, ctrl_f, ctrl_g, num_gen, seed) {

  var pool_max_size = 20
  var spawn_num = 1
  var pool = []
  if (seed != null) {pool.push(seed)}
  var big_pool_fitness = []
  var measure_const = mk_measure_constraint(pre, post, ctrl_f, ctrl_g, 200)
  // populate the pool of random constraints
  for (var i = 0; i < pool_max_size; i++) {
    pool.push(constr_mkr([])) 
  }
  // commence evolution
  // for num gen number of rounds
  for (var gen_i = 0; gen_i < num_gen; gen_i++) {
    console.log("generation: ", gen_i)
    console.log("if quality degrade, look at this pool: ", pool)
    // make babies and measure fitness
    big_pool_fitness = []
    for (var i = 0; i < pool_max_size; i++) {
      var mom = pool[i]
      big_pool_fitness.push([measure_const(mom), mom])
      for (var j = 0; j < spawn_num; j++) {
        console.log("spawn n push")
        var child = mom.spawn_child()
        var other_rand = pool[randI(0, pool.length)]
        var crossed = child.cross_over(other_rand)
        big_pool_fitness.push([measure_const(crossed), crossed])
//        console.log("spawn n push")
//        var child = mom.spawn_child()
//        big_pool_fitness.push([measure_const(child), child])
      }
    }
    big_pool_fitness.sort(fitness_sort_fun)
    console.log("if quality degrade, look at this big_pool: ", big_pool_fitness)
    big_pool_fitness.reverse()
    // survival of the top
    pool = []
    for (var k = 0; k < pool_max_size; k++) {
      pool.push(big_pool_fitness[k][1])
    }
    console.log("top fitness: ", measure_const(pool[0]), " params: ", pool[0].params)
    loggy("top fitness: "+ measure_const(pool[0])+ " params: "+ pool[0].params)
  }
  return pool[0]
}

