// create a measurer for fitness, generate a fixed number of test cases
function mk_measurer (abstr_pre, pred_pre, abstr_post, pred_post, test_n) {
  var test_cases = []
  // huge bug fix, we gotta push the non-concretized version,
  // the conc version is modified during simulation causing bugs
  for (var i = 0; i < test_n; i++) {
    test_cases.push(pred_pre.sample())
  }
  function get_test_score(bodies) {
    var abstr_state = abstr_post.abstraction(bodies)
    return pred_post.soft_sat(abstr_state)
  }
  // given a controller, measure how good it is
  function measure(ctrl) {
    var ret = 0.0
    for (var i = 0; i < test_n; i++) {
      var init_state = abstr_pre.concretize(test_cases[i])
      var final_state = simulate(init_state, ctrl, 5000)
      ret += get_test_score(final_state)
    }
    return ret
  } 
  return measure
}

function train_ctrl(ctrl_mkr, abstr_pre, pred_pre, abstr_post, pred_post, num_gen) {
  var pool_max_size = 20
  var spawn_num = 1
  var pool = []
  var big_pool_fitness = []
  var measure = mk_measurer(abstr_pre, pred_pre, abstr_post, pred_post, 100)
  // populate the pool of random controllers
  for (var i = 0; i < pool_max_size; i++) {
    pool.push(ctrl_mkr([],pred_post)) 
  }
  // commence evolution
  // for num gen number of rounds
  for (var gen_i = 0; gen_i < num_gen; gen_i++) {
    console.log("generation: ", gen_i)
    console.log("pool ", _.map(pool, function(x){return x.params}))
    // make babies and measure fitness
    big_pool_fitness = []
    for (var i = 0; i < pool_max_size; i++) {
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
    for (var k = 0; k < pool_max_size; k++) {
      pool.push(big_pool_fitness[k][1])
    }
    console.log("top fitness: ", measure(pool[0]), " params: ", pool[0].params)
  }
  return pool[0]
}

// measure a middle constraint
function mk_measurer_constraint(abstr_pre, pred_pre, ctrl_f, 
                                abstr_post, pred_post, ctrl_g,
                                abstr_middle, test_n) {
  function measure(pred_middle) {
    var score_first = 0.0
    var score_second = 0.0
    for (var i = 0; i < test_n; i++) {
      // get the first score
      var rand_state_a = abstr_pre.concretize(pred_pre.sample())
      var state_fa = simulate(rand_state_a, ctrl_f, 5000)
      score_first += pred_middle.soft_sat(abstr_middle.abstraction(state_fa))
      // get the second score
      var rand_state_b = abstr_middle.concretize(pred_middle.sample())
      var state_gb = simulate(rand_state_b, ctrl_g, 5000)
      score_second += pred_post.soft_sat(abstr_post.abstraction(state_gb))
    }
    return score_first * score_second
  }
  return measure
}

function train_constraint(constr_mkr, abstr_pre, pred_pre, ctrl_f, 
                          abstr_post, pred_post, ctrl_g,
                          abstr_middle, num_gen) {

  var pool_max_size = 20
  var spawn_num = 1
  var pool = []
  var big_pool_fitness = []
  var measure_const = mk_measurer_constraint(abstract_state_A, predicate_A, ctrl_f,
                                             abstract_state_C, predicate_C, ctrl_g,
                                             abstract_state_B, 100)
  // populate the pool of random controllers
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
        big_pool_fitness.push([measure_const(child), child])
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
  }
  return pool[0]
}

