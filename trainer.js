// create a measurer for fitness, generate a fixed number of test cases
function mk_measurer (abstr_pre, pred_pre, abstr_post, pred_post, test_n) {
  var  test_cases = []
  for (var i = 0; i < test_n; i++) {
    test_cases.push(abstr_pre.concretize(pred_pre.sample()))
  }
  var measurer = {
    test_cases : test_cases,
    // given a final state of the system, measure the score of that state
    get_test_score : function (bodies) {
      var abstr_state = abstr_post.abstraction(bodies)
      return pred_post.soft_sat(abstr_state)
    },
    // given a controller, measure how good it is
    measure : function (ctrl) {
      var ret = 0.0
      for (var i = 0; i < test_n; i++) {
        var init_state = this.test_cases[i]
        var final_state = simulate(init_state, ctrl, 5000)
        ret += this.get_test_score(final_state)
      }
      return ret
    } 
  }
  return measurer
}

function train_ctrl(ctrl_mkr, abstr_pre, pred_pre, abstr_post, pred_post, num_gen) {
  var pool_max_size = 50
  var pool = []
  // generate a pool of random controllers
  for (var i = 0; i < pool_max_size; i++) {
    pool.push(ctrl_mkr([],pred_post)) 
  }
  // for num gen number of rounds
  for (var gen_i = 0; gen_i < num_gen; gen_i++) {
    console.log("generation: ", gen_i)
    console.log("creating big pool")
    // make babies
    var big_pool = []
    for (mom of pool) {
      big_pool.push(mom)
      for (var i = 0; i < 3; i++) {
        big_pool.push(mom.spawn_child())
      }
    }
    console.log("big pool of size ", big_pool.length)
    // get a measurer for that round
    console.log("measuring...")
    var measurer = mk_measurer(abstr_pre, pred_pre, abstr_post, pred_post, 100)
    var big_pool_fitness = []
    for (var i = 0; i < big_pool.length; i++) {
      console.log("falala")
      var ctrl = big_pool[i]
      big_pool_fitness.push([measurer.measure(ctrl),ctrl])
    }
    console.log("sorting... ")
    big_pool_fitness.sort()
    // survival of the top 
    pool = []
    for (var i = 0; i < pool_max_size; i++) {
      pool.push(big_pool_fitness[i][1])
    }
    console.log("next pool size: ", pool.length)
    console.log("top fitness: ", measurer.measure(pool[0]), " params: ", pool[0].params)
  }
}

