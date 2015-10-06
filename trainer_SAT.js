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

// project the constraint B onto the feasible image set Bf
// given a controller, try to satisfy it while being as close to B as possible
function mk_project_img_measure(pre, B, ctrl_f, test_n) {
  function measure(constraint_candidate) {
    var num_sat = 0
    for (var i = 0; i < test_n; i++) {
      var rand_state_a = pre.concrete_sample()
      var state_fa = simulate(rand_state_a, ctrl_f, 5000)
      num_sat += constraint_candidate.sat(constraint_candidate.abstraction(state_fa))
    }
    // penalize constraint for number of unsat points.
    // if all point are satisfied, try to get close to B
    return -100 * (test_n - num_sat) - constraint_dist(constraint_candidate, B)
  }
  return measure
}

// project the constraint B onto the feasible preimage set Bg
// given a controller, try to satisfy it while being as close to B as possible
function mk_project_preimg_measure(post, B, ctrl_g, test_n) {
  function measure(constraint_candidate) {
    var num_sat = 0
    for (var i = 0; i < test_n; i++) {
      var rand_state_b = constraint_candidate.concrete_sample()
      var state_gb = simulate(rand_state_b, ctrl_g, 5000)
      num_sat += post.sat(post.abstraction(state_gb))
    }
    // peanalize constraint for number of unsat poitns
    // if all set, try to get close to B
    return -100 * (test_n - num_sat) - constraint_dist(constraint_candidate, B)
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

