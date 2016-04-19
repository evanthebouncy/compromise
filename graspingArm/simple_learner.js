// measure how well a triple work together
// take precondition, concretize it
// map it with the controller 
// check if it meets the post-condition
function measure_triple (pre, ctrl, post, count) {
	var ret = 0
	for (var i = 0; i < count; i++) {
  		var conc_state = pre.concretize()
  		var resultz = simulate$(conc_state, ctrl, pre, post, 8000)
  		if (post.checks(resultz)) {
  			ret += 1
  		}
  	}
  	return ret
}

// measure how well a triple work together
// take precondition, concretize it
// map it with the controller 
// check if it meets the post-condition
function measure_triple_soft (pre, ctrl, post, count) {
	var ret = 0
	for (var i = 0; i < count; i++) {
  		var conc_state = pre.concretize()
  		var resultz = simulate$(conc_state, ctrl, pre, post, 8000)
  		ret += post.softchecks(resultz)
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
	var best_sofar_score = measure_triple(pre, ctrl_maker(best_sofar, pre, post), post, count)
	console.log("so far score ", best_sofar_score)
	for (var i = 0; i < count * 2; i++) {

		var rand_theta = sample_theta(ranges)

		// console.log("animating!!?")

		// simulate_and_render(pre, ctrl_maker(rand_theta), post, 8000, false, function(){})    

		console.log("cur score ", cur_score)
		var cur_ctrl = ctrl_maker(rand_theta, pre, post)
		var cur_score = measure_triple_soft(pre, cur_ctrl, post, count)
		ranges = get_half_range(cur_score / count, rand_theta, ranges)
		// console.log("updated ranges ", ranges)

		if (cur_score > best_sofar_score) {
			best_sofar = rand_theta
			best_sofar_score = cur_score
			console.log("improved params", rand_theta)			
			console.log("cur improved score ", cur_score)
		}
	}
	return best_sofar
}

// learn a precondition
function learn_pre(pre_maker, ctrl, post, best_sofar, ranges, count) {
	var best_sofar_score = measure_triple(pre_maker(best_sofar), ctrl, post, count)
	console.log("so far score ", best_sofar_score)
	for (var i = 0; i < count * 2; i++) {
		var rand_theta = sample_theta(ranges)
		var cur_pre = pre_maker(rand_theta)
		var cur_score = measure_triple_soft(cur_pre, ctrl, post, count)
		ranges = get_half_range(cur_score / count, rand_theta, ranges)
		// console.log("updated ranges ", ranges)
		console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			console.log("rand pre", rand_theta)
			console.log("cur improved score ", cur_score)
			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return best_sofar
}

// learn a post condition
function learn_post(pre, ctrl, post_maker, best_sofar, ranges, count) {
	var best_sofar_score = measure_triple(pre, ctrl, post_maker(best_sofar), count)
	for (var i = 0; i < count; i++) {
		var rand_theta = sample_theta(ranges)
		console.log("rand post", rand_theta)
		var cur_post = post_maker(rand_theta)
		var cur_score = measure_triple(pre, ctrl, cur_post, count)
		console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return best_sofar
}

function proj_Bf(pre, ctrl_maker, post_maker, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_post_sofar, post_range, count) {
	// first learn a controller
	var init_post = post_maker(best_post_sofar)
	var best_ctrl_theta = learn_controller(pre, ctrl_maker, init_post, best_ctrl_sofar, ctrl_ranges, count)
	var best_ctrl = ctrl_maker(best_ctrl_theta, pre, init_post)

	// then match a state to that best controller
	var best_post = learn_post(pre, best_ctrl, post_maker, best_post_sofar, post_range, count)
	return [best_post, best_ctrl_theta]
}

function proj_Bg(pre_maker, ctrl_maker, post, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_pre_sofar, pre_range, count) {
	// first learn a controller
	var init_pre = pre_maker(best_pre_sofar)
	var best_ctrl_theta = learn_controller(init_pre, ctrl_maker, post, best_ctrl_sofar, ctrl_ranges, count)
	var best_ctrl = ctrl_maker(best_ctrl_theta, init_pre, post)

	// then match a state to that best controller
	var best_pre = learn_pre(pre_maker, best_ctrl, post, best_pre_sofar, pre_range, count)
	return [best_pre, best_ctrl_theta]
}

