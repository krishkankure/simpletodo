import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('apikey'); //
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const taskList = {
    allTasks: [], // convert this to taskNameMap 
    // maybe add another object literal for tasks/buttons in general? --> not all the function are here anyways
    // create a buttonMap
    currentTaskIds: [],
    listContainer: document.getElementById("items"),
    maxTaskListSize: 1000000,
    maxAiSize: 5,
    getRandomInt: function(max) {
        let min = 0;
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    //give the same uiud to each button-taskName pair
    addToList: function() {
        let x = this.getRandomInt(this.maxTaskListSize).toString();
        if(this.currentTaskIds.includes(x) && this.currentTaskIds.length < this.maxTaskListSize){
            this.addToList(); // eventually you should check if the task list has reached 1million size
        }
        else {
            return x;
        }
    },
    isAllWhitespace: function(str) {
        return str.trim().length === 0;
    },
    // key = some random number, value will be button/taskname (two different tasks)
    // also check if specificTask.value is null and refuse
    deleteTask: function(uuid){
        document.getElementById(uuid).remove();
    },
    throwEmptyModal: function() {
        const closeBtn = document.getElementById("closeModal");
        const modal = document.getElementById("modal");
        modal.classList.add("open");
        closeBtn.addEventListener("click", () => {
            modal.classList.remove("open");
        });
    },
    aiWindow: function() {
        const cancelButton = document.getElementById("aiCancelModal");
        const saveButton = document.getElementById("aiSaveModal");
        const modal = document.getElementById("aiModal");
        modal.classList.add("open");
        cancelButton.addEventListener("click", () => {
            modal.classList.remove("open");
        });
        saveButton.addEventListener("click", async () => {
            let textInput = document.getElementById("aiInput");
            if(!this.isAllWhitespace(textInput.value)) {
                const prompt = `Given a question, problem, or description about life, create up to 5 concise to-do list items as a response. Even if the prompt is vague and general, you must try to provide actionable steps.

                Example:

                Prompt: "I'm feeling overwhelmed."

                Response: "Prioritize tasks::Practice mindfulness::Take breaks::Limit distractions::Seek support"

                Please format your response with each to-do item separated by '::'. Do not include any other text besides the separator and the to-do items. If you cannot create a description for your task, either due to the input being completely being completely incoherent or just inappropriate, please return "cannot". The prompt is: `;
                const modelInput = prompt + textInput.value;
                const result = await model.generateContent(modelInput);
                let modelOutput = result.response.text();
                if (modelOutput.includes("::")) {
                    let modelOutputSplit = modelOutput.split("::");
                    console.log(modelOutputSplit);
                    let amt = this.maxAiSize;
                    modelOutputSplit.forEach((value) => {
                        if(amt >= 0) {
                            this.addTask(value);
                            amt--;
                        }
                    });
                    modal.classList.remove("open");
                    modelOutputSplit = [];
                }
                document.getElementById("aiInput").value = '';
            }
        });
    },
    addTask: function(specificTaskValue) {
        if(specificTaskValue == null || specificTaskValue == '') {
            this.throwEmptyModal();
        }
        else {
            let uuid = this.addToList(); //gens new uuid
            //let taskid = uuid + "-task";
            this.currentTaskIds.push(uuid);
            // actual fucking item generation

            const listItem = document.createElement("li");
            const listText = document.createElement("span");
            const node = document.createTextNode(specificTaskValue);
            listText.appendChild(node);
            listText.className = "list-text";
            // adds text span to li
            listItem.id = uuid;
            listItem.className = "list-item";
             //adds delete button to li

            //BUTTON
            let buttonid = uuid + "-button";
            let editBtnId = uuid + "-edit";
            let completeId = uuid + "-complete";
            console.log("uuid generated");
            console.log("set: " + specificTaskValue + " with key " + uuid); 
            // this.allTasks.push(specificTask.value);

            const editButton = document.createElement("button");
            const editIcon = document.createElement("i");
            
            editIcon.className = 'fa-solid fa-pen-to-square';
            editButton.appendChild(editIcon);
            editButton.id = editBtnId;
            editButton.className = "edit-button";
            
            const xButton = document.createElement("button");
            const xIcon = document.createElement("i");
            
            xIcon.className = 'fa-solid fa-x';
            xButton.appendChild(xIcon);
            xButton.className = "delete-button";
            xButton.id = buttonid;

            const completeBox = document.createElement("input");
            //const completeIcon = document.createElement("i");
            
            //completeIcon.className = 'fa-solid fa-check';
            //completeButton.appendChild(completeIcon);
            completeBox.className = "complete-box";
            completeBox.type = "checkbox";
            completeBox.id = completeId;

            completeBox.addEventListener('change', function() {
                if (this.checked) {
                    listItem.classList.add('checked');
                    editButton.classList.add('checked');
                    editButton.disabled = true;
                } 
                else {
                  console.log("Checkbox is not checked..");
                  listItem.classList.remove('checked');
                  editButton.classList.remove('checked');
                  editButton.disabled = false;
                }
              });

            xButton.addEventListener("click", () => { // when x is clicked
                listItem.classList.add('deleting');
                setTimeout(() => {
                    this.deleteTask(uuid);
                }, 300); // 300ms matches the animation duration
            });
            

            editButton.addEventListener("click", () => { // when edit is clicked
                const closeBtn = document.getElementById("editCloseModal");
                const discardBtn = document.getElementById("discardCloseModal");
                const modal = document.getElementById("editModal");
                const editInput = document.getElementById("editInput");
                editInput.value = listItem.querySelector('.list-text').textContent; // getting value from the taskmap of this uuid
                modal.classList.add("open");

                const saveEdit = () => {
                    const newTaskValue = editInput.value;
                    if (newTaskValue.trim() !== '') {
                        listItem.querySelector('.list-text').textContent = newTaskValue;
                    }
                    editInput.value = '';
                    modal.classList.remove("open");
                    closeBtn.removeEventListener("click", saveEdit);
                };
                closeBtn.addEventListener("click", saveEdit);
                editInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        saveEdit();
                    }
                });
                discardBtn.addEventListener("click", () => { // when x is clicked
                    modal.classList.remove("open");
                });
    
            });
            listItem.appendChild(completeBox); // NEXT UP 9/19-9/20 make this shit a check box
            listItem.appendChild(listText); 
            listItem.appendChild(editButton);
            listItem.appendChild(xButton); // ADD BUTTON HERE
            document.getElementById("list").appendChild(listItem); // adds it to the ul
            document.getElementById("task").value = '';
            
        }
    },

    clear: function() {
        const proceed = document.getElementById("proceedCloseModal");
        const cancel = document.getElementById("cancelCloseModal");
        const modal = document.getElementById("warningModal");
        if(document.getElementById('list').innerHTML != '') {
            modal.classList.add("open");
            proceed.addEventListener("click", () => {
            
            const listItems = document.querySelectorAll('#list li');
    
            // Add the 'deleting' class to each <li> element
            listItems.forEach(specificItem => {
                specificItem.classList.add('deleting');
            });
        
            // Wait for the animation duration before clearing the list
            setTimeout(() => {
                this.currentTaskIds = [];
                document.getElementById('list').innerHTML = '';
            }, 300); // 300ms matches the animation duration
            modal.classList.remove("open");
            });
            cancel.addEventListener("click", () => {
                modal.classList.remove("open");
            });    
        }
        
    }
}

document.getElementById("add-task").onclick = function() {
    taskList.addTask(document.getElementById("task").value);
};
document.getElementById("clear-task").onclick = function() {
    taskList.clear();
};
document.getElementById("ai-task").onclick = function() {
    taskList.aiWindow();
};
document.getElementById("task").addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        console.log('Enter key pressed!');
        taskList.addTask(document.getElementById("task").value);
    }
});

// next tasks:
// have the task text input reset when task is added
// add some fonts.
// more animations
