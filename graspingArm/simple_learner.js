// measure how well a triple work together
// take precondition, concretize it
// map it with the controller 
// check if it meets the post-condition
function measure_triple_constr (pre, ctrl, post, count) {
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
function measure_triple_ctrler (pre, ctrl, post, count) {
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
	var best_sofar_score = measure_triple_ctrler(pre, ctrl_maker(best_sofar, pre, post), post, count)
	console.log("so far score ", best_sofar_score)
	for (var i = 0; i < count; i++) {

		var rand_theta = sample_theta(ranges)

		// console.log("animating!!?")

		// simulate_and_render(pre, ctrl_maker(rand_theta), post, 8000, false, function(){})    

		var cur_ctrl = ctrl_maker(rand_theta, pre, post)
		var cur_score = measure_triple_ctrler(pre, cur_ctrl, post, count)
		// console.log("cur score ", cur_score)

		// console.log("updated ranges ", ranges)

		if (cur_score > best_sofar_score) {
			best_sofar = rand_theta
			best_sofar_score = cur_score
			ranges = get_half_range(cur_score / count, rand_theta, ranges)

			console.log("improved params", rand_theta)			
			console.log("cur improved score ", cur_score)
		}
	}
	return best_sofar
}

// learn a precondition
function learn_pre(pre_maker, ctrl, post, best_sofar, ranges, count) {
	var orig_pre = best_sofar
	var best_sofar_score = measure_triple_constr(pre_maker(best_sofar), ctrl, post, count) + 1.0 / (1.0 + vdist(best_sofar, orig_pre))
	console.log("so far score ", best_sofar_score)
	for (var i = 0; i < count; i++) {
		var rand_theta = sample_theta(ranges)
		var cur_pre = pre_maker(rand_theta)
		var cur_score = measure_triple_constr(cur_pre, ctrl, post, count) + 1.0 / (1.0 + vdist(rand_theta, orig_pre))
					console.log("rand pre", rand_theta)
		// console.log("updated ranges ", ranges)
		console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			console.log("cur improved score ", cur_score)
			// ranges = get_half_range(cur_score / count, rand_theta, ranges)

			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return [best_sofar, best_sofar_score]
}

// learn a post condition
function learn_post(pre, ctrl, post_maker, best_sofar, ranges, count) {
	var orig_post = best_sofar
	var best_sofar_score = measure_triple_constr(pre, ctrl, post_maker(best_sofar), count) + 1.0 / (1.0 + vdist(best_sofar, orig_post))
	console.log("score sofar", best_sofar_score)

	for (var i = 0; i < count; i++) {
		var rand_theta = sample_theta(ranges)
		// console.log("rand post", rand_theta)
		var cur_post = post_maker(rand_theta)
		console.log("vidst ", vdist(rand_theta, orig_post))
		var cur_score = measure_triple_constr(pre, ctrl, cur_post, count) + 1.0 / (1.0 + vdist(rand_theta, orig_post))

		// console.log("cur score ", cur_score)
		if (cur_score > best_sofar_score) {
			console.log("rand post", rand_theta)
			console.log("cur improved score ", cur_score)
					ranges = get_half_range(cur_score / count, rand_theta, ranges)

			best_sofar = rand_theta
			best_sofar_score = cur_score
		}
	}
	return [best_sofar, best_sofar_score]
}

function proj_Bf(pre, ctrl_maker, post_maker, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_post_sofar, post_range, count, good_ratio) {
	// first learn a controller
	var init_post = post_maker(best_post_sofar)
	console.log("learning ctrl")
	var best_ctrl_theta = learn_controller(pre, ctrl_maker, init_post, best_ctrl_sofar, ctrl_ranges, count)
	var best_ctrl = ctrl_maker(best_ctrl_theta, pre, init_post)

	console.log("learning post")

	// then match a state to that best controller
	var best_post_score = learn_post(pre, best_ctrl, post_maker, best_post_sofar, post_range, count)

	var best_post = best_post_score[0]
	var best_score = best_post_score[1]

	if (best_score >= good_ratio * count) {
		console.log("success!")
		return [best_post, best_ctrl_theta]
	} else {
		console.log("FAILED retrying ", best_score, count, best_post, "========")
		return proj_Bf(pre, ctrl_maker, post_maker, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_post_sofar, post_range, count, good_ratio * 0.9)
	}
}

function proj_Bg(pre_maker, ctrl_maker, post, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_pre_sofar, pre_range, count, good_ratio) {
	// first learn a controller
	var init_pre = pre_maker(best_pre_sofar)
	console.log("learning ctrl")
	var best_ctrl_theta = learn_controller(init_pre, ctrl_maker, post, best_ctrl_sofar, ctrl_ranges, count)
	var best_ctrl = ctrl_maker(best_ctrl_theta, init_pre, post)
	
	console.log("learning pre")

	// then match a state to that best controller
	var best_pre_score = learn_pre(pre_maker, best_ctrl, post, best_pre_sofar, pre_range, count)

	var best_pre = best_pre_score[0]
	var best_score = best_pre_score[1]

	if (best_score >= good_ratio * count) {
		console.log("success!")
		return [best_pre, best_ctrl_theta]
	} else {
		console.log("FAILED retrying ", best_score, count, best_pre, "=========")
		return proj_Bg(pre_maker, ctrl_maker, post, 
	             best_ctrl_sofar, ctrl_ranges, 
	             best_pre_sofar, pre_range, count, good_ratio * 0.7)
	}
}

