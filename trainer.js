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
  var spawn_num = 3
  var pool = []
  var big_pool_fitness = []
  // populate the pool of random controllers
  for (var i = 0; i < pool_max_size; i++) {
    pool.push(ctrl_mkr([],pred_post)) 
  }
  // commence evolution
  // for num gen number of rounds
  for (var gen_i = 0; gen_i < num_gen; gen_i++) {
    console.log("generation: ", gen_i)
    console.log("creating big pool")
    // make babies and measure fitness
    big_pool_fitness = []
    var measure = mk_measurer(abstr_pre, pred_pre, abstr_post, pred_post, 50)
    for (var i = 0; i < pool_max_size; i++) {
      var mom = pool[i]
      big_pool_fitness.push([measure(mom), mom])
      for (var j = 0; j < spawn_num; j++) {
        console.log("spawn n push")
        var child = mom.spawn_child()
        big_pool_fitness.push([measure(child), child])
      }
    }
    big_pool_fitness.sort()
    big_pool_fitness.reverse()
    console.log(big_pool_fitness)
    // survival of the top
    pool = []
    for (var k = 0; k < pool_max_size; k++) {
      pool.push(big_pool_fitness[k][1])
    }
    console.log("top fitness: ", measure(pool[0]), " params: ", pool[0].params)
  }
  return pool[0]
}

