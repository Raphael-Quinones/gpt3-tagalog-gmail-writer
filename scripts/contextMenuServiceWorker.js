const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
            if(result['openai-key']) {
                const decodedKey = atob(result['openai-key']);
                resolve(decodedKey)
            }
        })
    })
}

//Generate OpenAI completion
const generate = async (prompt) => {
    //Get API key from storage
    const key = await getKey();
    const url = 'https://api.openai.com/v1/completions';

    //Call completions endpoint
    const completionResponse = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 1250,
            temperature: 0.7
        })
    }

    )

    //Select top choice and send back
    const completion = await completionResponse.json();
    return completion.choices.pop();


}


const generateCompletionAction = async (info) => {
    try {
        const { selectionText } = info;
        const basePromptPrefix = `
        Write me a detailed table of contents for a blog post with the title below
        Title: 
        `

        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`)
        console.log(baseCompletion.text)
    } catch (error) {
        console.log(error);
    }
}

//Adds the "Generate Email" button when you right click
chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate Email',
    contexts: ['selection'],
    });
//listens for when a contextMenu gets clicked for this extension
chrome.contextMenus.onClicked.addListener(generateCompletionAction);



