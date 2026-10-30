type Pair = readonly [string, string];
export interface ReasoningQuestion {
  prompt: Pair;
  choices: readonly Pair[];
  correct: number;
  frame: number;
  solutionFrame: number;
  wrongFrame: number;
}

// Choice order and question stops come from the recovered MainTimeline handlers.
// Indices are zero-based here; source bQuiz buttons are one-based.
export const reasoningQuestions: Readonly<Record<string, ReasoningQuestion>> = {
  grandma: {
    prompt: ["If she climbs at the same speed, how long will it take her to get to the ninth floor from the first?", "Сколько времени надо старушке, чтобы подняться на 9-й этаж, если она будет двигаться с той же скоростью?"],
    choices: [["8 min", "8 мин"], ["9 min", "9 мин"], ["10 min", "10 мин"], ["11 min", "11 мин"]],
    correct: 2, frame: 479, solutionFrame: 502, wrongFrame: 498,
  },
  hunter: {
    prompt: ["What color was the bear?", "Какого цвета был медведь?"],
    choices: [["Black", "Чёрный"], ["White", "Белый"], ["Brown", "Бурый"], ["Red", "Рыжий"]],
    correct: 1, frame: 918, solutionFrame: 941, wrongFrame: 939,
  },
  snail: {
    prompt: ["On which day will the snail reach a height of 10 metres?", "На какой день улитка заползёт на высоту 10 метров?"],
    choices: [["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"]],
    correct: 1, frame: 1137, solutionFrame: 1160, wrongFrame: 1158,
  },
  staruhi: {
    prompt: ["At what time did the sun rise?", "В котором часу был рассвет?"],
    choices: [["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"]],
    correct: 1, frame: 1175, solutionFrame: 1198, wrongFrame: 1196,
  },
  tram: {
    prompt: ["What was the number of the tram?", "Какой был номер трамвая?"],
    choices: [["10", "10"], ["11", "11"], ["13", "13"], ["14", "14"]],
    correct: 2, frame: 881, solutionFrame: 904, wrongFrame: 901,
  },
  bacteria: {
    prompt: ["When was the glass half full?", "Когда стакан был полон наполовину?"],
    choices: [["in 20 sec", "через 20 сек"], ["in 30 sec", "через 30 сек"], ["in 45 sec", "через 45 сек"], ["in 59 sec", "через 59 сек"]],
    correct: 3, frame: 501, solutionFrame: 524, wrongFrame: 522,
  },
  hand: {
    prompt: ["If you keep counting back and forth along one hand, which finger will you reach at 1000?", "Если продолжить счёт пальцев, какой палец будет по счёту 1000-м?"],
    choices: [["pinkie", "мизинец"], ["ring", "безымянный"], ["middle", "средний"], ["index", "указательный"], ["thumb", "большой"]],
    correct: 3, frame: 671, solutionFrame: 694, wrongFrame: 691,
  },
};

export type QuestionAttempt = "unanswered" | "retry" | "correct";
export function answerReasoningQuestion(question: ReasoningQuestion, choice: number): QuestionAttempt {
  return Number.isInteger(choice) && choice >= 0 && choice < question.choices.length
    && choice === question.correct ? "correct" : "retry";
}
