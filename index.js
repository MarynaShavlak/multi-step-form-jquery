import { QUIZ__ANSWER, QUIZ__QUESTIONS } from './data.js';

$(document).ready(function () {
  const tabClass = '.tab';
  const stepClass = '.step';
  const indexBtnClass = '.index-btn';
  const indexNextBtnClass = 'index-btn--next';
  const btns = $(indexBtnClass);
  const steps = $(stepClass);
  const closeModalBtn = $('[data-modal-close]');
  const backdrop = $('[data-modal]');
  let formValidationMessage = null;

  const userAnswers = {
    question1: null,
    question2: null,
    question3: null,
    question4: null,
    question5: null,
    question6: null,
    question7: null,
  };

  updateQuestionToShow($('#tab-1'));
  setFocusedState();
  addEventHandlers();

  function addEventHandlers() {
    closeModalBtn.click(handleModalClose);
    backdrop.click(closeModal);

    btns.click(function () {
      handleButtonClick($(this));
    });

    steps.click(function () {
      handleStepClick($(this));
    });

    $('.submit-btn').click(function (e) {
      e.preventDefault();
      handleFormSubmit();
    });
    $('.back-btn').click(function (e) {
      e.preventDefault();
      handleBackBtnClick();
    });
  }

  function handleFormSubmit() {
    const lastQuestionNumber = $(tabClass).length;
    updateTextAnswer(lastQuestionNumber);
    formValidationMessage = validateForm();
    if (formValidationMessage) {
      openModal();
    } else {
      const result = calculateQuizResult();
      showFinalResult(result, lastQuestionNumber);
      showResultsBlock();
    }
  }

  function validateForm() {
    const unansweredQuestions = Object.keys(userAnswers)
      .filter(key => userAnswers[key] === null)
      .map(key => key.replace('question', ''));
    if (unansweredQuestions.length > 0) {
      const message = `Please, answer the questions ${unansweredQuestions.join(
        ', ',
      )}.`;
      return message;
    }
  }

  function areAnswersEqual(quizAnswer, userAnswer) {
    if (Array.isArray(quizAnswer)) {
      return areArraysEqual(quizAnswer, userAnswer);
    } else {
      return quizAnswer === userAnswer;
    }
  }

  function getWrongAnswerObject(questionNumber, quizAnswer, userAnswer) {
    return {
      question: questionNumber,
      correct: quizAnswer,
      wrong: userAnswer,
    };
  }

  function calculateQuizResult() {
    let quizResult = 0;
    const quizAnswersList = Object.values(QUIZ__ANSWER);
    const userAnswersList = Object.values(userAnswers);
    const wrongAnswersList = [];
    quizAnswersList.forEach((quizAnswer, index) => {
      const userAnswer = userAnswersList[index];
      const isCorrectAnswer = areAnswersEqual(quizAnswer, userAnswer);
      updateAnswerResultsBlock(index, isCorrectAnswer);
      if (isCorrectAnswer) {
        quizResult += 1;
      } else {
        const wrongAnswerObject = getWrongAnswerObject(
          index + 1,
          quizAnswer,
          userAnswer,
        );
        wrongAnswersList.push(wrongAnswerObject);
      }
    });
    setResultsInfo(wrongAnswersList);
    return quizResult;
  }

  function setResultsInfo(wrongAnswersList) {
    showCorrectAnswersTable(wrongAnswersList);
    $('.info-icon').click(function () {
      handleInfoIconClick($(this));
    });
  }

  function handleInfoIconClick(icon) {
    const row = icon.closest('tr');
    const answerInfoBlock = row.next('tr');
    if (answerInfoBlock.is(':hidden')) {
      answerInfoBlock.find('div').css('display', 'none');
      answerInfoBlock.css('display', 'table-row').find('div').slideDown(300);
    } else {
      answerInfoBlock.find('div').slideUp(300, function () {
        answerInfoBlock.hide();
      });
    }
    row.toggleClass('opened');
    icon.toggleClass('chosen');
  }

  function generateCodeMarkup(selectedQuestion, questionNumber) {
    const { text, code, answer } = selectedQuestion;
    return `
        <tr  class="answer-info-block changeable" style="display:none;">
          <td colspan="3">
          <div>
          <p class="answer-info-text">
              Question ${questionNumber}:
              <span class="answer-info-name">${text}</span>
            </p>
            <code class="answer-info-code">${code}</code>
            <p class="answer-info-result">
              Correct answer:
              <span class="answer-info-value">${answer}</span>
            </p>
          </div>
            
          </td>
        </tr>`;
  }

  function generateListMarkup(selectedQuestion, questionNumber) {
    const { text, answer } = selectedQuestion;
    return `
        <tr  class="answer-info-block changeable" style="display:none;">
          <td colspan="3">
          <div>
          <p class="answer-info-text">
          Question ${questionNumber}:
          <span class="answer-info-name">${text}</span>
        </p>
        <p class="answer-info-result"> Correct answer:</p>
        <ul class="answer-info-list">
          ${answer.map(el => `<li> ${el}</li>`).join('')}
        </ul> </div>
            
          </td>
        </tr>`;
  }

  function showCorrectAnswersTable(wrongAnswersList) {
    if (wrongAnswersList.length === 0) return;
    const tableRowsMarkup = wrongAnswersList.map(generateMarkupForRow).join('');
    const tableMarkup = `
    <div class="info">
      <p class="results-text table-title">Correct answers</p>
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Your Answer</th>
            <th>Correct Answer</th>
          </tr>
        </thead>
        <tbody>
        ${tableRowsMarkup}
        </tbody>
      </table>
    </div>
  `;

    $('.answer-list').after(tableMarkup);
  }

  function generateMarkupForRow({ question, wrong, correct }) {
    const selectedQuestion = QUIZ__QUESTIONS[`question${question}`];
    const { code } = selectedQuestion;
    const markup = code
      ? generateCodeMarkup(selectedQuestion, question)
      : generateListMarkup(selectedQuestion, question);

    return `<tr>
      <td data-id="question">${question}</td>
      <td data-id="wrong">${wrong}</td>
      <td data-id="correct"><span>${correct}</span> <i class="fa-regular fa-circle-question info-icon" data-icon="${question}"></i></td>
    </tr>
    ${markup}`;
  }

  function updateAnswerResultsBlock(index, isCorrectAnswer) {
    const answers = $('.answer');
    const resultAnswerEl = answers.filter(`#answer-${index + 1}`);
    if (isCorrectAnswer) {
      resultAnswerEl.addClass('answer--correct');
    } else {
      resultAnswerEl.addClass('answer--wrong');
    }
  }

  function showFinalResult(result, max) {
    $('.results-value').text(`${result}/${max}`);
  }

  function areArraysEqual(array1, array2) {
    if (array1?.length !== array2?.length) {
      return false;
    }
    const sortedArray1 = array1.slice().sort();
    const sortedArray2 = array2.slice().sort();
    return sortedArray1?.every((value, index) => value === sortedArray2[index]);
  }

  function setFocusedState() {
    const textInputs = $(':text');
    textInputs.focus(function () {
      $(this).addClass('focused');
    });
    textInputs.blur(function () {
      $(this).removeClass('focused');
    });
  }

  function getTabOrder(tabID) {
    const match = tabID.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  function updateInterface(currentQuestion, showQuestion) {
    updateProgressBar(showQuestion);
    updateUserAnswersObj(currentQuestion);
    updateQuestionToShow($(`#tab-${showQuestion}`));
  }

  function handleButtonClick(btn) {
    const questionID = btn.closest(tabClass).attr('id');
    const currentQuestion = getTabOrder(questionID);
    const isNextBtn = btn.hasClass(indexNextBtnClass);
    const showQuestion = isNextBtn ? currentQuestion + 1 : currentQuestion - 1;
    updateInterface(currentQuestion, showQuestion);
  }

  function handleStepClick(stepEl) {
    const activeStepID = $('.step--current:last').attr('id');
    const currentQuestion = getTabOrder(activeStepID);
    const showQuestion = getTabOrder(stepEl.attr('id'));
    if (currentQuestion === showQuestion) return;
    updateInterface(currentQuestion, showQuestion);
  }

  function handleBackBtnClick() {
    resetForm();
    resetUserAnswers();
    hideResultsBlock();
  }

  function resetUserAnswers() {
    for (const key in userAnswers) {
      userAnswers[key] = null;
    }
  }
  function resetForm() {
    $('#quiz-form')[0].reset();
  }

  function updateQuestionToShow(questionToShow) {
    $('.tab').hide();
    questionToShow.show();
    $('.results').hide();
  }

  function showResultsBlock() {
    $('.tabs-wrap').hide();
    $('.step-list').hide();
    $('.results').show();
  }
  function hideResultsBlock() {
    updateQuestionToShow($('#tab-1'));
    setInitialProgressBar();
    $('.tabs-wrap').show();
    $('.step-list').show();
    $('.results').hide();
  }

  function updateProgressBar(toShow) {
    $('.step').removeClass('step--current');
    for (let i = 1; i <= toShow; i++) {
      $(`#step-${i}`).addClass('step--current');
    }
  }

  function setInitialProgressBar() {
    $('.step').removeClass('step--current');
    $('#step-1').addClass('step--current');
  }

  function updateUserAnswersObj(currentQuestion) {
    const element = $("input[name='question" + currentQuestion + "']").get()[0];
    const typeAttributeValue = $(element).attr('type');
    if (typeAttributeValue === 'checkbox') {
      updateCheckBoxAnswers(currentQuestion);
    } else if (typeAttributeValue === 'radio') {
      updateRadioAnswers(currentQuestion);
    } else {
      updateTextAnswer(currentQuestion);
    }
  }

  function updateRadioAnswers(currentQuestion) {
    const inputSelector =
      "input[type='radio'][name='question" + currentQuestion + "']:checked";
    const radioInput = $(inputSelector);
    if (radioInput.length !== 0) {
      const value = radioInput.val();
      const questionKey = 'question' + currentQuestion;
      userAnswers[questionKey] = value;
    }
  }

  function updateCheckBoxAnswers(currentQuestion) {
    const chosenVariants = $(
      "input[type='checkbox'][name='question" + currentQuestion + "']:checked",
    );
    if (chosenVariants.length !== 0) {
      const answers = chosenVariants
        .map(function () {
          return $(this).val();
        })
        .get();
      userAnswers['question' + currentQuestion] = answers;
    }
  }

  function updateTextAnswer(currentQuestion) {
    const inputSelector =
      'input[type="text"][name="question' + currentQuestion + '"]';
    const textInput = $(inputSelector);
    const value = textInput.val().trim();
    if (value === '') return;
    const questionKey = 'question' + currentQuestion;
    userAnswers[questionKey] = value;
  }

  function closeModal() {
    $('body').removeClass('modal-open');
    backdrop.addClass('backdrop--hidden');
    formValidationMessage = null;
  }

  function handleModalClose(e) {
    e.stopPropagation();
    closeModal();
  }

  function openModal() {
    $('body').addClass('modal-open');
    backdrop.removeClass('backdrop--hidden');
    $('.modal__text').text(formValidationMessage);
  }
});
