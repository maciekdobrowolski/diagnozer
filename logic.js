const hugeList = document.querySelector('.huge_list');
const searchBar = document.querySelector('#searchSymptom');
const questionsArea= document.querySelector('.question');
const analizatorScreen= document.querySelector('.analizatorScreen');
let id='';
let symptomsAded=[];

let symptoms = [];
let diseases= [];

let shouldAnalize= false;

const loadArrays = async () => {
    try {
        const res = await fetch('SymptomsOutput.json');
        const resp = await fetch('DiseasesOutput.json');
        symptoms = await res.json();
        diseases = await resp.json();
    } catch (err) {
        console.error(err);
    }
};

searchBar.addEventListener('keyup', (e) => {

    const searchString = e.target.value.toLowerCase();

    const filteredSymptoms = symptoms.filter((symptom) => {
        return (
            (symptom.text.toLowerCase().includes(searchString)) ||
            (symptom.laytext.toLowerCase().includes(searchString)) ||
			(symptom.alias.toLowerCase().includes(searchString) ||
            symptom.name.toLowerCase().includes(searchString))
        );
    });
    createHugeList(filteredSymptoms);
});

const createHugeList = (searchedSymptomsArr) => {
	if(searchedSymptomsArr.length < 25){
		const html = searchedSymptomsArr
        .map((arr) => {
            return `<a href="#questionArea" class="list-group-item list-group-item-action text-muted fs-6 element" id="${arr.name}">${arr.text}</a>`;
        })
        .join('');

		hugeList.innerHTML = html;
		listenElements();
	}else{
		hugeList.innerHTML='';
	}
};

const listenElements= ()=>{
	const allElements= document.querySelectorAll('.element');

	allElements.forEach(div=>{
		div.addEventListener('click', ()=>{
            symptomClicked(div.getAttribute('id'));
        });
	});
}

const symptomClicked = nameInArr =>{
    //wyciągnij taki oiekt z symptoms
    const symptomToAsk = symptoms.filter((symptom) => {
        return (
            symptom.name.includes(nameInArr)
        );
    });

    showQuestion(symptomToAsk);
	//kliknąłem-> wyświetl pytanie, przewiń pytanie, wyczyść searchera uzyskaj odp lub number
    searchBar.value='';
    hugeList.innerHTML='';
}

const showQuestion= symptomToAsk =>{
    //choices exist i exist min jeżeli value 3 to sprawdź to podaj nazwę
    //choices exist i min=0
    //choices=0 i min exist
    const choices= symptomToAsk[0].choices || false;
    const haveMax= symptomToAsk[0].max || false;
    const question= symptomToAsk[0].laytext;
    const name= symptomToAsk[0].name;

    if(!choices){
        //tutaj zapytaj o wartość
        const max= parseFloat(symptomToAsk[0].max);
        const min= parseFloat(symptomToAsk[0].min);
        const step= parseFloat(symptomToAsk[0].step) || 1;

        let html= `<div class="ask fs-6 text-muted">
            ${question}
            </div>
            <div class="input-group mb-2 mt-2">
                <input type="number" class="form-control valueGiver" placeholder="Value... ${min} - ${max} (step ${step})" min="${min}" max="${max}">
                <button class="btn btn-outline-secondary btn-primary valueGiver text-light" type="button">Add</button>
            </div>`
        questionsArea.innerHTML=html;

        document.querySelector('button.valueGiver').addEventListener('click', ()=>{
            const val= document.querySelector('input.valueGiver').value;
            questionAnwsered(val, name, 'waliduj');
        });
    }else if(haveMax === false){
        //tylko są choices
        let buttons="";
        let html="";
        let arrValues=[];

        choices.forEach(choice=>{
            buttons += `<button type="button" class="btn btn-primary mt-2">${choice.laytext}</button>`;
            arrValues.push(choice.value);
        });

        html= `<div class="ask fs-6 text-muted">
                    ${question}
                </div>
                <div class="btn-group-vertical width">
                    ${buttons}
                </div>`

        questionsArea.innerHTML=html;

        const btns= document.querySelectorAll('.btn-group-vertical button');

        btns.forEach( (btn, i) =>{
            btn.addEventListener('click', ()=>{ questionAnwsered(arrValues[i], name); });
        });
    }else{
        //tutaj i choices a w 3 opcji trzeba dać imputa if value="3" to daj mi wartość
        const max= symptomToAsk[0].max;
        const min= symptomToAsk[0].min;
        const step= parseFloat(symptomToAsk[0].step) || 1;
        let buttons="";
        let arrValues=[];

        choices.forEach(choice=>{

            if(choice.value == 3){
                buttons += `<div class="input-group mb-2 mt-2">
                <input type="number" class="form-control valueGiver" placeholder="Yes? Value... ${min} - ${max} (step ${step})" min="${min}" max="${max}">
                <button class="btn btn-outline-secondary btn-primary valueGiver text-light" type="button">Add</button>
                </div>`;
            }else{
                buttons += `<button type="button" class="btn btn-primary mt-2">${choice.laytext}</button>`;
            }
            arrValues.push(choice.value);
        });

        html= `<div class="ask fs-6 text-muted">
                    ${question}
                </div>
                <div class="btn-group-vertical width">
                    ${buttons}
                </div>`

        questionsArea.innerHTML=html;

        const btns= document.querySelectorAll('.btn-group-vertical button');

        btns.forEach( (btn, i) =>{
            btn.addEventListener('click', ()=>{

                if(arrValues[i]==3){
                    let val= document.querySelector('input.valueGiver').value;
                    val= parseFloat(val);
                    questionAnwsered(val, name, 'waliduj');
                }else{
                    questionAnwsered(arrValues[i], name)
                }
            });
        });
    }
}

const questionAnwsered= (value, name, waliduj="nie")=>{

    if(waliduj=='waliduj'){
        //znajdź min i max, zawaliduj lub nie
        const symptomTowalidate = symptoms.filter( (symptom) => {
            return (symptom.name.includes(name))

        });

        const min= symptomTowalidate[0].min;
        const max= symptomTowalidate[0].max;
        if((value>=min) && (value<=max)) waliduj='ok';
    }

    if(waliduj != 'waliduj'){
        const options = {
            method: 'POST',
            url: 'https://endlessmedicalapi1.p.rapidapi.com/UpdateFeature',
            params: {name: name, value: value, SessionID: id},
            headers: {
                'x-rapidapi-host': 'endlessmedicalapi1.p.rapidapi.com',
                'x-rapidapi-key': '/API_KEY/'
                }
        };

        axios.request(options).then( response => {
            console.log(response.data);
            questionsArea.innerHTML='';
            ArrSymptomsActualisation(name, value);
        }).catch( error => {
            console.error(error);
        });
    }
}

const ArrSymptomsActualisation= (name, value)=>{
    //przeszukaj tablicę, jeżeli będzie to nic jeżeli niebędzie to dodaj
    let flag= false

    symptomsAded.forEach((symptom) => {
            if(symptom[0].includes(name)) flag=true;
    });

    if(!flag){
        const newSegment= [name, value];
        symptomsAded.push(newSegment);
        addTileWithSymptom();
    }
}

const addTileWithSymptom= () =>{
    let html='';
    symptomsAded.forEach(tile=>{
        html+=  `<button type="button" class="btn btn-danger btn-sm p-2 m-2 fw-light ${tile[0]}DELETE">${tile[0]}<span class="fw-bold">    &#10006;<span></span></button>`
    });

    document.querySelector('.symptoms_aded').innerHTML= html;

    symptomsAded.forEach(tile=>{
        const className= '.'+tile[0]+'DELETE';
        document.querySelector(className).addEventListener('click',()=>{ deleteSymptom(tile[0]); });
    });

    shouldIAnalize();
}

const deleteSymptom= (name)=>{
    //usuń z tablicyArrSymptoms kafelek no i wyślij DELETE
    const options = {
        method: 'POST',
        url: 'https://endlessmedicalapi1.p.rapidapi.com/DeleteFeature',
        params: {name: name, SessionID: id},
        headers: {
            'x-rapidapi-host': 'endlessmedicalapi1.p.rapidapi.com',
            'x-rapidapi-key': 'API_KEY'
        }
    };

    axios.request(options).then( response=> {
        console.log(response.data);
        //znajdź ten wpis i go usuń // zwróć tablicę bez elementu
        let newArray=[];
        for(let i=0; i<symptomsAded.length; i++){
            if(symptomsAded[i][0] != name){
                newArray.push(symptomsAded[i]);
            }
        }
        symptomsAded= newArray;
        addTileWithSymptom();
    }).catch(error=> {
        console.error(error);
    });
}

const getBasicInfo= i =>{
    const input= basicInfoInputs[i];

    const name= input.name;
    let value= parseInt(input.value);
    let min= input.min;
    let max= input.max;

    if((name=="Temp") || (name=="BMI")){
        //Przelicz na Celsjusze i daj float
        value= parseFloat(input.value);
        if(name=="Temp"){
            let farenheit= parseFloat((value * 1.8) + 32);
            value= farenheit;
            min=95;
            max=109;
        }
    }
    if((value >= min) && (value <= max))  questionAnwsered(value, name);
}

const shouldIAnalize= ()=>{
    const basicInfoNames=['Age','BMI','Temp','HeartRate','SBP','DBP','O2Sats','Gender'];
    if(symptomsAded.length > 5){
        shouldAnalize=true;
    }else{
        shouldAnalize=false;
    }
    //wyodrębnij jakikolwiek inny objaw niż tamte 5
    symptomsAded.forEach(symptom=>{
        if((symptom[0]!=basicInfoNames[0]) && (symptom[0]!=basicInfoNames[1]) && (symptom[0]!=basicInfoNames[2]) && (symptom[0]!=basicInfoNames[3]) && (symptom[0]!=basicInfoNames[4]) && (symptom[0]!=basicInfoNames[5]) && (symptom[0]!=basicInfoNames[6]) && (symptom[0]!=basicInfoNames[7])){
            shouldAnalize= true;
        }
    });
    analiza();
}

const showToast= ()=>{
    const toastLive = document.getElementById('liveToast');
    const toast = new bootstrap.Toast(toastLive);
    toast.show();
    sound.play();
}
////////////////////////////////////////////////////////////////////////////////////////////
//SEKWENCJA STARTOWA-> NADANIE ID i ZGODA NA REGULAMIN + wyświetlenie ekarnu

const start= ()=>{
    const isChecked= document.querySelector('#flexCheckDefault').checked;
    if(isChecked){
        const options = {
            method: 'GET',
            url: 'https://endlessmedicalapi1.p.rapidapi.com/InitSession',
            headers: {
                'x-rapidapi-host': 'endlessmedicalapi1.p.rapidapi.com',
                'x-rapidapi-key': 'APIKEY'
                }
            };

            axios.request(options).then(response => {
                id= response.data.SessionID;
                const options2 = {
                    method: 'POST',
                    url: 'https://endlessmedicalapi1.p.rapidapi.com/AcceptTermsOfUse',
                    params: {SessionID: id, passphrase: "I have read, understood and I accept and agree to comply with the Terms of Use of EndlessMedicalAPI and Endless Medical services. The Terms of Use are available on endlessmedical.com"},
                    headers: {
                        'x-rapidapi-host': 'endlessmedicalapi1.p.rapidapi.com',
                        'x-rapidapi-key': 'API_KEY'
                        }
                    };
                    axios.request(options2).then( response => {
                        document.querySelector('.menue').classList.add('display-n');
                        document.querySelector('main').classList.remove('display-n');
                    }).catch( error => {
                        console.error(error);
                    });

            }).catch(function (error) {
                console.error(error);
            });
        showToast();
    }
}

////ANALIZATOR/////////////////////////////////////////////////////////////////////////////////////////////////////

const analiza= ()=>{
    if(shouldAnalize){
        const options = {
            method: 'GET',
            url: 'https://endlessmedicalapi1.p.rapidapi.com/Analyze',
            params: {SessionID: id},
            headers: {
                'x-rapidapi-host': 'endlessmedicalapi1.p.rapidapi.com',
                'x-rapidapi-key': 'API_KEY'
            }
        };

        axios.request(options).then(response=> {
            //wyślij do rozdysponowania
            unpackDiseases(response.data);
            getSuggested();
        }).catch(error=> {
            console.error(error);
        });

    }else{
        //przywracaj html
        const html=`<div class="d-flex justify-content-center">
        <div class="spinner-border text-bootstrap mt-5" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        </div>`
        analizatorScreen.innerHTML=html;
    }
}

const unpackDiseases= response=>{
    const arrDiseasesFromAPI= response.Diseases;
    const arrVariableImportancesFromAPI= response.VariableImportances;

    let diseaseArr=[];
    let diseaseProbability=[];
    let importantVariablesArr=[];

    arrDiseasesFromAPI.forEach(disease=>{
        const key= Object.keys(disease);
        diseaseArr.push(key[0]);
        const probability= parseFloat(disease[key[0]]);
        diseaseProbability.push(Math.round((probability*100)));
    });

    arrVariableImportancesFromAPI.forEach((variable, i)=>{
        const val= Object.values(variable);
        importantVariablesArr.push(val[0]);
    });

    //my mamy tekst, a teraz wyjmij dane z tablicy globalnej diseases na podstawie diseaseArr
    let diseasesTalkAboutIt=[];

    diseaseArr.forEach((textToFind, i)=>{
        diseasesTalkAboutIt[i]= diseases.filter(record=>{
            return (record.text.includes(textToFind));
        });
    });

    let html='<div class="list-group">';
    diseasesTalkAboutIt.forEach((record, i)=>{
        let klasa='';
        if((record[0].IsCantMiss !== undefined) && (record[0].IsCantMiss===true)) klasa= " warning-alarm";
        if((record[0].IsImmLifeThreatening !== undefined) && (record[0].IsImmLifeThreatening===true))  klasa= " alarm";
        html+= `<button type="button" class="list-group-item list-group-item-action fs-6 d-flex justify-content-between align-items-start fw-light${klasa}" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" id="ranking${i}">
            <div class="ms-2 me-auto">
                ${record[0].text}
            </div>
            <span class="badge bg-primary">${diseaseProbability[i]}%</span>
        </button>`;
    });

    html+=`</div>
    <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasRight" aria-labelledby="offcanvasRightLabel" data-bs-scroll="true" data-bs-backdrop="false"></div>`;

    if(diseaseArr.length > 0){
        analizatorScreen.innerHTML=html;
        sound.play();
        diseasesTalkAboutIt.forEach((record, i)=>{
            document.querySelector('#ranking'+i).addEventListener('click', ()=>{
                doCanvas(record,i,diseaseProbability[i],importantVariablesArr[i]);
            });
        });
    }

    //Zadaj pytanie
    let name='';
    //znajdź chorobę któerj Probability nie jest 100%
    for(let i=0; i<diseaseProbability.length; i++){
        if(diseaseProbability[i] != 100){
            for(let j=0; j < importantVariablesArr[i].length; j++){
                name=importantVariablesArr[i][j][0];
                symptomsAded.forEach(quest=>{
                    if(quest[0] == importantVariablesArr[i][j][0]) name='';
                });
                if(name!='') break;
            }
            if(name!='') break;
        }
    }
    if(diseaseProbability.length > 0) symptomClicked(name);
}

const doCanvas= (record, i, probability, importantVariables)=>{
    //wypełnij canvasa po wciśnięciu
    const laytext= record[0].laytext || '';
    const category= record[0].category || '';
    const wiki= record[0].wiki || '';
    const wiki2= record[0].wiki2 || '';
    const wiki3= record[0].wiki3 || '';
    const wiki4= record[0].wiki4 || '';
    const ICD10= record[0].ICD10 || '';
    const IsRare= record[0].IsRare || '';
    const IsGenderSpecific= record[0].IsGenderSpecific || '';
    const IsImmLifeThreatening= record[0].IsImmLifeThreatening || ''; //danger
    const IsCantMiss= record[0].IsCantMiss || ''; //warning

    let questionsNames=[];
    let questiontext=[];
    let questionImportance=[];


    importantVariables.forEach(question=>{
        //chcę dostać pytanie z symptoms[] tekst do wyświetlenia i imię do zapamiętania
        const symptomToAsk = symptoms.filter((symptom) => {
            return (
                symptom.name.includes(question[0])
            );
        });
        questionsNames.push(symptomToAsk[0].name);
        questiontext.push(symptomToAsk[0].text);
        questionImportance.push(Math.round(question[1]*100));
    });

    let html=`<div class="offcanvas-header">
    <h5 id="offcanvasRightLabel">${laytext}      <span class="badge bg-primary">${probability}%</span></h5>`;

    //jeżeli IsImmLifeThreatening to danger else if IsCantMiss to warning else BRAK KODU
    if(IsImmLifeThreatening) html+=`<span class="text-danger fw-bolder">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                                            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                                            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                                        </svg>
                                    </span>`;
    else if((IsCantMiss)) html+=`<span class="text-warning fw-bolder">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
                                        <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"/>
                                        <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"/>
                                    </svg>
                                </span>`;
    html+= `<button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body">
            <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="me-auto fw-light fs-6">
                        <div class="fw-bold">Disease</div>
                        ${laytext}
                    </div>
                </li>`;

    if(IsImmLifeThreatening) html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="me-auto">
                                            <div class="fw-bold text-danger">It's threatening for life.</div>
                                        </div>
                                        <span class="text-danger">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-exclamation-octagon-fill" viewBox="0 0 16 16">
                                                <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                            </svg>
                                        </span>
                                    </li>`;
    if(category != '') html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="me-auto fw-light fs-6">
                                    <div class="fw-bold">Category</div>
                                    ${category}
                                </div>
                            </li>`;
    if(ICD10 != '') html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="me-auto fw-light fs-6">
                                    <div class="fw-bold">ICD10</div>
                                    ${ICD10}
                                </div>
                            </li>`;
    if(IsGenderSpecific == true) html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                                        <div class="me-auto fw-light fs-6">
                                            <div class="fw-bold">Gender specyfic</div>
                                            Yes
                                        </div>
                                    </li>`;
    if(IsRare ==true) html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                                <div class="me-auto fw-light fs-6">
                                    <div class="fw-bold">It's rare.</div>
                                    <span class="text-danger">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-exclamation-octagon-fill" viewBox="0 0 16 16">
                                            <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                        </svg>
                                    </span>
                                </div>
                            </li>`;
    if((wiki != '') || (wiki2 != '') || (wiki3 != '') || (wiki4 != '')){
        html+=`<li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="me-auto fw-light fs-6">
                        <div class="fw-bold text-primary">Links</div>`
        if(wiki != '') html+=`<div class="text-danger fw-light text-decoration-underline">
                                <a href="${wiki}" target="_blank">${wiki}</a>
                            </div>`;
        if(wiki2 != '') html+=`<div class="text-danger fw-light text-decoration-underline">
                                <a href="${wiki2}" target="_blank">${wiki2}</a>
                            </div>`;
        if(wiki3 != '') html+=`<div class="text-danger fw-light text-decoration-underline">
                                <a href="${wiki3}" target="_blank">${wiki3}</a>
                            </div>`;
        if(wiki4 != '') html+=`<div class="text-danger fw-light text-decoration-underline">
                            <a href="${wiki4}" target="_blank">${wiki4}</a>
                            </div>`;
        html+=`</div>
                </li>`;
    }
    html+=`</ul>
            <div class="mt-3">
                <h5>If you want to precise the diagnosis, ask...</h5>
            </div>
            <div class="mt-2">
                <div class="list-group">`

    questiontext.forEach((text,i)=>{
        html+=`<button type="button" class="list-group-item list-group-item-action fs-6 d-flex justify-content-between align-items-start fw-light ${questionsNames[i]}">
        <div class="ms-2 me-auto">
            ${text}
        </div>
        <span class="badge bg-success fw-normal">  ${parseFloat(questionImportance[i]/100)}</span></button>`;
    });

    html+=`</div></div></div>`

    document.querySelector('#offcanvasRight').innerHTML=html;

    //listenersy
    questionsNames.forEach(name=>{
        const questionId= '.'+name;
        document.querySelector(questionId).addEventListener('click', ()=>{
            symptomClicked(name);
            const kanw = document.getElementById('offcanvasRight');
            const canv = new bootstrap.Toast(kanw);
            canv.hide();
        });
    });

}

document.querySelector('#start').addEventListener('click', ()=>{start()});

const basicInfoInputs= document.querySelectorAll('input.basicInfo');

basicInfoInputs.forEach((input, i)=>{
    input.addEventListener('blur', ()=>{ getBasicInfo(i); });
});

document.querySelector('#btnradio1').addEventListener('click', ()=>{
    questionAnwsered(1, 'Gender');
});

document.querySelector('#btnradio3').addEventListener('click', ()=>{
    questionAnwsered(2, 'Gender');
});

loadArrays();

const sound= new Audio('message.mp3');
//////////////////////////////////POLIGON/////////////////////////////////////////
const getSuggested=()=>{
    const html=`<p class="text-muted m-2">
        My programmer is working on this feature...
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-workspace" viewBox="0 0 16 16">
  <path d="M4 16s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H4Zm4-5.95a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
  <path d="M2 1a2 2 0 0 0-2 2v9.5A1.5 1.5 0 0 0 1.5 14h.653a5.373 5.373 0 0 1 1.066-2H1V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9h-2.219c.554.654.89 1.373 1.066 2h.653a1.5 1.5 0 0 0 1.5-1.5V3a2 2 0 0 0-2-2H2Z"/>
</svg></p>`;
    document.querySelector('.suggests').innerHTML=html;
}

document.getElementById('refresh').addEventListener('click', ()=>{
    location.reload();
});
