const upload=document.getElementById('upload');
const grainSlider=document.getElementById('grain');
const slicesInput=document.getElementById('slices');
const ratioSelect=document.getElementById('ratio');
const brightnessInput=document.getElementById('brightness');
const contrastInput =document.getElementById('contrast');
const satInput=document.getElementById('saturation');
const processBtn=document.getElementById('processBtn');
const zipBtn=document.getElementById('zipBtn');
const output=document.getElementById('output');
const igSection=document.getElementById('ig-preview-section');
const igSlider=document.getElementById('ig-slider');
const liveCanvas=document.getElementById('live-canvas');
const liveCtx=liveCanvas.getContext('2d');
let currentZip=null;
let activeImage= null;

upload.addEventListener('change',async(e)=>{
    if(e.target.files.length>0){
        activeImage=await loadImage(e.target.files[0]);
        updateLivePreview();

    }
});
[grainSlider,brightnessInput,contrastInput,satInput].forEach(input=>{
    input.addEventListener('input',updateLivePreview);
});
function updateLivePreview(){
    if(!activeImage)return;
    const MAX_PREVIEW_WIDTH=800;
    let scale=  1;
    if(activeImage.width>MAX_PREVIEW_WIDTH){
        scale=MAX_PREVIEW_WIDTH/activeImage.width;

    }
    const pWidth=activeImage.width* scale;
    const pHeight= activeImage.height*scale;
    liveCanvas.width=pWidth;
    liveCanvas.height=pHeight;
    const b=brightnessInput.value;
    const c=contrastInput.value;
    const s=satInput.value;
    const grainAmount=parseInt(grainSlider.value);
    liveCtx.filter=`brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
    liveCtx.drawImage(activeImage,0,0,pWidth,pHeight);
    if(grainAmount>0){
        const imgData=liveCtx.getImageData(0,0,pWidth,pHeight);
        const data=imgData.data;
        for(let j=0;j<data.length;j+=4){
            const noise=(Math.random()-0.5)*  grainAmount;
            data[j]=Math.min(255,Math.max(0,data[j]+noise));
            data[j+1]=Math.min(255,Math.max(0,data[j+1]+ noise));
            data[j+2]=Math.min(255,Math.max(0,data[j+2]+ noise));

        }
        liveCtx.putImageData(imgData,0,0);
    
    }
}
processBtn.addEventListener('click',async()=>{
    const files=upload.files;
    if(files.length===0)return;
    output.innerHTML='';
    igSlider.innerHTML='';
    currentZip=new JSZip();
    const grainAmount=parseInt(grainSlider.value);
    const slices=parseInt(slicesInput.value);
    const ratioVal= ratioSelect.value;
    const b=brightnessInput.value;
    const c= contrastInput.value;
    const s =satInput.value;

    for(let file of files){
        const img=await loadImage(file);
        const baseName=file.name.split('.')[0];
        let cropX=0,cropY=0, cropW= img.width,cropH=img.height;
        if(ratioVal!== 'auto'){
            const targetSliceRatio=parseFloat(ratioVal);
            const targetTotalRatio=targetSliceRatio*slices;
            const imgRatio=img.width/img.height;
            if(imgRatio>targetTotalRatio){
                cropH= img.height;
                cropW = cropH* targetTotalRatio;
                cropX=(img.width-cropW)/2;

            }else{
                cropW=img.width;
                cropH=cropW/targetTotalRatio;
                cropY=(img.height-cropH)/2;

            }
        }
        const sliceWidth=cropW/ slices;
        const sliceHeight= cropH;
        for(let i=0;i<slices; i++){
            const canvas=document.createElement('canvas');
            const ctx=canvas.getContext('2d');
            canvas.width= sliceWidth;
            canvas.height =sliceHeight;

            ctx.filter=`brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
            ctx.drawImage(img,cropX+(i*sliceWidth),cropY,sliceWidth,sliceHeight,0,0,sliceWidth,sliceHeight);
            if(grainAmount>0){
                const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
                const data=imgData.data;
                for(let j=0; j<data.length; j+=4){
                    const noise=(Math.random() -0.5)*grainAmount;
                    data[j]=Math.min(255,Math.max(0,data[j]+noise));
                    data[j+1]=Math.min(255,Math.max(0,data[j+1]+noise));
                    data[j+2]=Math.min(255,Math.max(0,data[j+2]+noise));

                }
               ctx.putImageData(imgData,0,0);

            }
            const dataUrl=canvas.toDataURL('image/png',1.0);
            const base64Data= dataUrl.split(',')[1];
            const fileName= `${baseName}_slice_${i+1}.png`;
            currentZip.file(fileName,base64Data,{base64:true});

            const wrapper=document.createElement('div');
            wrapper.className='slice-container';
            if(slices===1)wrapper.classList.add('single');
            const previewNode=document.createElement('img');
            previewNode.src= dataUrl;
            const link= document.createElement('a');
            link.href=dataUrl;
            link.download=fileName;
            link.className ='download-link';
            link.textContent= `DL Slice ${i+1}`;
            wrapper.appendChild(previewNode);
            wrapper.appendChild(link);
            output.appendChild(wrapper);
            const igImg =document.createElement('img');
            igImg.src= dataUrl;
            igSlider.appendChild(igImg);

        }

    }
    zipBtn.style.display='block';
    igSection.style.display='flex';
});
zipBtn.addEventListener('click',()=>{
    if(!currentZip) return;
    zipBtn.textContent="ZIPPING...";
    zipBtn.style.pointerEvents="none";
    currentZip.generateAsync({type:'blob'}).then(function(content){
        const link=document.createElement('a');
        link.href=URL.createObjectURL(content);
        link.download="grainbath_export.zip"; 
        link.click();
        zipBtn.textContent="DOWNLOAD ALL(ZIP)";
        zipBtn.style.pointerEvents="auto";

   });
});


function loadImage(file){
    return new Promise((resolve)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
        const img=new Image();
        img.onload=()=> resolve(img);
        img.src= e.target.result;
    };
    reader.readAsDataURL(file);
});
}
