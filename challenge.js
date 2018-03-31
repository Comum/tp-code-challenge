$(document).ready(function() {

  var ThisPlaceurl="http://dev-challenge.thisplace.com";
  var myName = 'Miguel';
  var active_dir = '/hello';
  var nr_questions = 5;

  var resp_request = get_request_page('POST', ThisPlaceurl, active_dir, {name: myName});
  console.log(resp_request);

  var next_step_url = '';
  var i, result;

  for(i = 1 ; i <= nr_questions ; i++) {

    next_step_url = get_next_step_info(resp_request);
    //always GET question
    resp_request = get_request_page('GET', ThisPlaceurl, next_step_url, {name: myName});
    console.log(resp_request);
    result = question_handler(resp_request);

    if(i == nr_questions) {
      //load final answer
      var output = document.getElementById('success_area');
      output.innerHTML = result;
    }
    else {
      console.log(result);
      next_step_url = get_next_step_info(resp_request);
      //alwasy POST answer
      resp_request = get_request_page('POST', ThisPlaceurl, next_step_url, {answer: result});
      console.log(resp_request);
    }
  }
});

function get_next_step_info(resp) {

  //looks for the character '/' and gets the rest of the path for the next question/answer

  var filtered = resp.replace(/\n/g, ' ').split(' ');
  var active_dir = filtered.filter(function(word) {
                                if(word.indexOf('/') > -1) {
                                  return word;
                                }
                              })
                            .join();

  return active_dir;
}

function get_request_page(type, url, url_dir, values) {

  //ajax request to POST or GET the request to continue the Q&A
  //requires jQuery to run (included in the head of the index.html file)

  var request_response = '';

  $.ajax({
      url: url+url_dir,
      data: values,
      type: type,
      async: false,
      success: function (resp) {
          request_response = resp;
      }
  });

  return request_response;
};

function question_handler(resp_request) {

  //reads the first word of the rendered response and handles it to the correct function

  var question_type = resp_request.split('\n')[0].split(' ')[0];

  if(question_type == 'Arithmetic') {
    return arithmetic_handler(resp_request);
  }
  else if(question_type == 'Word') {
    return word_handler(resp_request);
  }
  else if(question_type == 'Guess') {
    return guess_handler(resp_request);
  }
}

function arithmetic_handler(resp_request) {

  //converts the numbers and the operator to a result
  //takes advantage of the fact the the page response is in a defined format

  var question = resp_request.split('\n')[2].split(' ');
  var nr_1 = parseInt(question[2]);
  var nr_2 = parseInt(question[4].replace('?', ''));
  var operator = question[3];

  return operator_converter(nr_1, nr_2, operator);
}

function operator_converter(nr_1, nr_2, operator) {

  //converts the operator word to the math operator and calculates the result

  var result = 0;

  switch(operator) {
    case 'plus': result = nr_1 + nr_2;
      break;
    case 'minus': result = nr_1 - nr_2;
      break;
    case 'times': result = nr_1 * nr_2;
      break;
  }

  return result;
}

function word_handler(resp_request) {

  //gets the first of last characters of the asked word
  //also takes advantage of the fact the the page response is in a defined format

  var question = resp_request.split('\n')[2].split(' ');
  var orientation = question[3];
  var nr_chars = parseInt(question[4]);
  var word = question[9].replace('?', '');

  var s_ini, s_end;

  if(orientation == 'first') {
    s_ini = 1;
    s_end = s_ini + nr_chars;
  }
  else if(orientation == 'last') {
    s_ini = 1 + (word.length - 2 - nr_chars);
    s_end = word.length - 1;
  }

  return word.substring(s_ini, s_end);
}

function guess_handler(resp_request) {

  //since it is a number between fixed values and the number of guesses is also fixed, I've opted to hard code this bit of information below
  //then the array with the possibilities is filterd acording the word "less" or "greater" until a correct guess is found (4 guesses is the highest of possibile guesses)

  var ThisPlaceurl="http://dev-challenge.thisplace.com";
  var post_answer_to = get_next_step_info(resp_request);
  var guess_possibilities = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  var my_guess;
  var nr_of_tries = 4;
  var i, j, result, guess_orientation, guess_aux;

  for(i = 0 ; i < nr_of_tries ; i++) {

    my_guess = guess_possibilities[Math.floor((guess_possibilities.length - 1) / 2)];

    result = get_request_page('POST', ThisPlaceurl, post_answer_to, {answer: my_guess} );

    //is it correct?
    var guess_result = result.split('\n')[0];
    //if correct break the for loop
    if(guess_result == 'Correct!') {
      console.log(my_guess);
      break;
    }

    //if it's incorrect, continue
    //first higher or lower, then filters the array
    guess_orientation = result.split('\n')[1].split(' ')[3];

    if(guess_orientation == 'less') {
      //guess_possibilities.filter(guess => guess < my_guess ); //not working
      guess_aux = [];
      for(j = 0 ; j < guess_possibilities.length ; j++) {
        if(guess_possibilities[j] < my_guess)
        {
          guess_aux.push(guess_possibilities[j]);
        }
      }
      guess_possibilities = guess_aux;
    }
    else if(guess_orientation == 'greater') {
      //guess_possibilities.filter(guess => guess > my_guess );
      guess_aux = [];
      for(j = 0 ; j < guess_possibilities.length ; j++) {
        if(guess_possibilities[j] > my_guess)
        {
          guess_aux.push(guess_possibilities[j]);
        }
      }
      guess_possibilities = guess_aux;
    }
  }

  var next_step_url = get_next_step_info(result);
  return get_request_page('GET', ThisPlaceurl, next_step_url);
}
