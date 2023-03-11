
function myFetch (url, method, data) {
    return new Promise((res, rej) => {
        const xhr = new XMLHttpRequest()
        xhr.open(method || "GET", url)
        xhr.responseType = "json"
        xhr.onload = function () {
            res(xhr.response)
        }
        xhr.onerror = function () {
            rej("error")
        }
        xhr.setRequestHeader("Content-Type", "application/json")
        xhr.send(JSON.stringify(data))
    })
}
const APIs = (() => {
    const createTodo = (newTodo) => {
        return myFetch("http://localhost:3000/todos", 'POST', newTodo)
        // return fetch("http://localhost:3000/todos", {
        //     method: "POST",
        //     body: JSON.stringify(newTodo),
        //     headers: { "Content-Type": "application/json" },
        // }).then((res) => res.json())
    }
    const deleteTodo = (id) => {
        return myFetch("http://localhost:3000/todos/" + id, "DELETE")
        // return fetch("http://localhost:3000/todos/" + id, {
        //     method: "DELETE",
        // }).then((res) => res.json())
    }
    const getTodos = () => {
        return myFetch("http://localhost:3000/todos/")

    }
    const updateIsDone = (id, updateTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, "PATCH", updateTodo)
        // return fetch("http://localhost:3000/todos/" + id, {
        //     method: "PATCH",
        //     body: JSON.stringify(updateTodo),
        //     headers: { "Content-Type": "application/json" },
        // }).then((res) => res.json())
    }
    const updateContent = (id, updateTodo) => {
        return myFetch("http://localhost:3000/todos/" + id, "PATCH", updateTodo)
        // return fetch("http://localhost:3000/todos/" + id, {
        //     method: "PATCH",
        //     body: JSON.stringify(updateTodo),
        //     headers: { "Content-Type": "application/json" },
        // }).then((res) => res.json())
    }
    return { createTodo, deleteTodo, getTodos, updateIsDone, updateContent }
})()
const Model = (() => {
    class State {
        #todos //private field
        #onChange //function, will be called when setter function todos is called
        constructor() {
            this.#todos = []
        }
        get todos () {
            return this.#todos
        }
        set todos (newTodos) {
            // reassign value
            console.log('in side setter', newTodos)
            this.#todos = newTodos
            this.#onChange?.() // rendering
        }

        subscribe (callback) {
            //subscribe to the change of the state todos
            this.#onChange = callback
        }
    }
    const { getTodos, createTodo, deleteTodo, updateIsDone, updateContent } = APIs
    return {
        State,
        getTodos,
        createTodo,
        deleteTodo,
        updateIsDone,
        updateContent
    }
})()
const View = (() => {
    const todolistEl = document.querySelector(".todo-list")
    const submitBtnEl = document.querySelector(".submit-btn")
    const inputEl = document.querySelector(".input")
    const donelistEl = document.querySelector('.done-list')
    const listsEl = document.querySelector('.lists')
    const renderTodos = (todos) => {
        let todosTemplate = ""
        let donesTemplate = ''
        console.log('inside ender', todos)
        todos.forEach((todo) => {
            if (todo.isDone) {
                const doneLiTemplate = `<li id="${todo.id}">
                <button class="move-btn done" >Move</button>
                <span class='${todo.id}'>${todo.content}</span><button class= "update-btn">Update</button>
            <button class="delete-btn" >delete</button></li>`
                donesTemplate += doneLiTemplate
            } else {
                const liTemplate = `<li id="${todo.id}">
                <span class='${todo.id}'>${todo.content}</span>
                <button class="update-btn">Update</button>
            <button class="delete-btn" >delete</button>
            <button  class="move-btn" >Move</button></li>`
                todosTemplate += liTemplate
            }
        })
        if (todos.length === 0) {
            todosTemplate = "<h4>no task to display!</h4>"
        }
        todolistEl.innerHTML = todosTemplate
        donelistEl.innerHTML = donesTemplate
    }
    const clearInput = () => {
        inputEl.value = ""
    }
    return { renderTodos, submitBtnEl, inputEl, listsEl, clearInput, todolistEl, donelistEl }
})()
const Controller = ((view, model) => {
    const state = new model.State()
    const init = () => {
        model.getTodos().then((todos) => {
            todos.reverse()
            state.todos = todos
        })
    }

    const handleUpdate = () => {
        //  let flag = 0
        view.listsEl.addEventListener('click', (event) => {
            if (event.target.className === "update-btn") {
                const liEl = event.target.parentNode
                const id = event.target.parentNode.id
                const spanEl = liEl.getElementsByTagName('span')[0]
                if (spanEl) {
                    const input = document.createElement('input')
                    input.value = spanEl.innerHTML
                    // liEl.children[0].remove()
                    // liEl.appendChild(input)
                    spanEl.replaceWith(input)
                } else {// 2 clicks?
                    event.target.addEventListener('click', (event) => {
                        const input = liEl.getElementsByTagName('input')[0]
                        const updateTodo = { content: input.value }
                        model.updateContent(+id, updateTodo).then(data => {
                            state.todos = state.todos.map(todo => {
                                if (todo.id === + id) {
                                    todo.content = input.value// New input.value
                                }
                                return todo
                            })
                            // console.log('inside undateContent', state.todos)
                        })
                    })
                }
            }
        })
    }

    const handleMove = () => {
        view.listsEl.addEventListener('click', (event) => {
            if (event.target.classList.contains("move-btn")) {
                const id = event.target.parentNode.id
                const updateTodo = { isDone: event.target.classList.contains('done') ? false : true }
                //console.log('updateTodo', updateTodo, +id)
                model.updateIsDone(+id, updateTodo).then(data => {
                    state.todos = state.todos.map(todo => {
                        if (todo.id === + id) {
                            todo.isDone = !todo.isDone
                        }
                        return todo
                    })
                    // console.log('inside undateISDONE', state.todos)
                    event.target.classList.toggle("done")
                })

            }
        })
    }
    const handleSubmit = () => {
        view.submitBtnEl.addEventListener("click", (event) => {
            /* 
                1. read the value from input
                2. post request
                3. update view
            */
            const inputValue = view.inputEl.value
            const newTodo = { content: inputValue, isDone: false }
            model.createTodo(newTodo).then((data) => {
                state.todos = [data, ...state.todos]
                view.clearInput()
            })
        })
    }

    const handleDelete = () => {
        /* 
           1. get id
           2. make delete request
           3. update view, remove
       */
        view.listsEl.addEventListener("click", (event) => {
            if (event.target.className === "delete-btn") {
                const id = event.target.parentNode.id
                console.log('id ', id)
                model.deleteTodo(+id).then((data) => {
                    state.todos = state.todos.filter((todo) => todo.id !== +id)
                    console.log('in the delete', state.todos)
                })
            }
        })

    }

    const bootstrap = () => {
        init()
        handleSubmit()
        handleDelete()
        handleMove()
        handleUpdate()
        state.subscribe(() => {
            view.renderTodos(state.todos)
        })
    }
    return {
        bootstrap,
    }
})(View, Model)

Controller.bootstrap()
