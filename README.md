# RESTful-framework-for-programming-evaluation-in-academia:


In academia, students and professors want a well-structured and implemented framework for writing and running code in both testing and learning environments. In a test or quiz setting, students prefer to type and have the ability to execute code. In an instructional medium such as a handout or online textbook, students would prefer to try out code snippets right in the browser without the need to install or switch to another program. Professors on the other hand would like the ability to build exams and quizzes via structured text files without multiple, repetitive steps that are time consuming. Finally, automated and near-immediate grading and feedback remains a huge advantage both parties are interested in.

Programming tests and quizzes today are given through the paper and pencil medium. This medium is not desirable as it does not allow for immediate feedback, which can frustrate both teachers and students alike. Students must wait for results and teachers must invest large amounts of time in grading students' answers. Another problem that arises due to this medium is the inability to type and format code. For students, in a high-pressure environment such as a quiz or test there is not always time to neatly write code, and erasing or revising written code can further reduce readability. As a result, teachers and students are forced to read and work with messy answers. Finally, this medium does not allow for the posibility of compiling and running code. The ability to execute code allows students to fix small mistakes such as syntax errors and other problems that do not necessarily have any implication on the testing content.

Online text-books and other similar learning environments suffer from similar problems (i.e., no immediate feedback, and readability issues), with the addition of the need to switch programs completely. Using these mediums require students to leave the browser, have a compiler or IDE installed, and copy or write code snippets in order to try concepts out on their own.

These issues have led to the use and/or creation of two separate products: Learning Management Systems (LMS), and online compilers. An LMS (e.g., Moodle, and Blackboard) can provide a web interface for building instructional articles, exams, and quizzes and give students a common interface for which to use. An LMS can also serve as a secure environment for testing and quizzes, and offer features such as multiple attempts, instant feedback, and question randomization. LMS also have the capability to integrate add-ons which can provide the ability to compile and run code written by students.

However, modifying or building quizzes and exams via LMS require multiple, repetitive steps that are more time consuming than editing a simple flat file. In addition, current LMS do not not give statistics on test and quiz properties, such as time spent per question. Existing add-ons for LMS such as moodle do not address this issue and the compiler features do not contain some of the requested properties mentioned above (e.g., immediate evaluation and feedback).

As for online compilers, students can type and execute code on any computer without the need for any other resources. These compilers are useful for learning environments as they do not require external resources, however alone they cannot be used in a testing or quiz setting due to the lack of submission security and grading.

Therefore, we believe no application exists which allows for an experienced user to quickly build learning modules, exams, or quizzes via structured text files for students to use, giving them the ability to write and run code and receive immediate feedback on submitted answers.

This project addresses these issues by creating a framework which provides a medium with the following goals:
- Allow professors to quickly build exams and quizzes via simple structured flat files
- Allow students to be able to type formatted code 
- Allow students to compile and run code
- Allow students and professors to get immediate statistic and feedback


Given this framework, professors can quickly and easily create quizzes, tests, and other learning environments. With students, they can type/compile code and receive immediate feedback on said created quizzes, tests, and other environments. We believe this will help professors limit time spent on building and grading tests and quizzes, and help students to feel more comfortable and therefore give greater focus to tests and quizzes (i.e., actual test content, not formatting and cleaning up answers).
