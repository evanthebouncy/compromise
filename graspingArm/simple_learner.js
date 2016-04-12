// measure how well a triple work together
// take precondition, concretize it
// map it with the controller 
// check if it meets the post-condition
function measure_triple (pre, ctrl, post, count) {
	var ret = 0
	for (var i = 0; i < count; i++) {
  		var conc_state = pre.concretize()
  		var resultz = simulate$(conc_state, ctrl, pre, post, 8000)
  		console.log("got a result")
  		if (post.checks(resultz)) {
  			ret += 1
  		}
  	}
  	return ret
}

// takes in ranges of the form [[a1, a2], ...]
// where a1 is a lower bnd, a2 is an upper bound
// so basically take a point out of this hyper-box at random
function sample_theta(ranges) {
	var ret = []
	for (var i = 0; i < ranges.length; i++) {
		ret.push(randomreal(ranges[i][0], ranges[i][1]))
	}
	return ret
}

// learn a controller
function learn_controller(pre, ctrl_maker, post, best_sofar, ranges, count) {
	var best_sofar_score = measure_triple(pre, ctrl_maker(best_sofar), post, count)
	for (var i = 0; i < count; i++) {
		var rand_theta = sample_theta(ranges)
		console.log(rand_theta)
		var cur_ctrl = ctrl_maker(rand_theta)
		var cur_score = measure_triple(pre, cur_ctrl, post, count)
		console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return best_sofar
}

// learn a precondition
function learn_pre(pre_maker, ctrl, post, best_sofar, ranges, count) {
	var best_sofar_score = measure_triple(pre_maker(best_sofar), ctrl, post, count)
	for (var i = 0; i < count; i++) {
		var rand_theta = sample_theta(ranges)
		console.log(rand_theta)
		var cur_pre = pre_maker(rand_theta)
		var cur_score = measure_triple(cur_pre, ctrl, post, count)
		console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return best_sofar
}
