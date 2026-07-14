const upload=document.getElementById('upload');
const grainSlider=document.getElementById('grain');
const slicesInput=document.getElementById('slices');
const processBtn=document.getElementById('processBtn');
const output=document.getElementById('output');
processBtn.addEventListener('click',async()=>{
    const files=upload.files;
    if(files.length===0)return;
    output.innerHTML='';
    const grainAmount=parseInt(grainSlider.value);
    const slices=parseInt(slicesInput.value);
    
    for(let file of files){
        const img=await loadImage(file);
        const sliceWidth=img.width/slices;
        const sliceHeight=img.height;
        for(let i=0;i<slices;i++){
            const canvas=document.createElement('canvas');
            const ctx=canvas.getContext('2d');
            canvas.width=sliceWidth;
            canvas.height=sliceHeight;
            ctx.drawImage(img, i*sliceWidth,0,sliceWidth,sliceHeight,0,0,sliceWidth,sliceHeight);
            if(grainAmount>0){
                const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
                const data=imgData.data;
                for(let j=0; j<data.length; j+=4){
                    const noise=(Math.random()-0.5)*grainAmount;
                    data[j]=Math.min(255,Math.max(0,data[j]+noise));
                    data[j+1]=Math.min(255,Math.max(0,data[j+1]+noise));
                    data[j+2]=Math.min(255,Math.max(0,data[j+2]+noise));
                }
                ctx.putImageData(imgData,0,0)

            }
            const dataUrl=canvas.toDataURL('image/png',1.0);
            const wrapper=document.createElement('div');
            wrapper.className='slice-container';
            
            const previewNode=document.createElement('img');
            previewNode.src=dataUrl;
            const link=document.createElement('a');
            link.href=dataUrl;
            link.download=`${file.name.split('.')[0]}_slice_${i+1}.png`;
            link.className='download-link';
            link.textContent=`DL Slice ${i+1}`;
            wrapper.appendChild(previewNode);
            wrapper.appendChild(link);
            output.appendChild(wrapper);
        }
    }
});
function loadImage(file){
    return new Promise((resolve)=>{
        const reader=new FileReader();
        reader.onload=(e)=>{
            const img=new Image();
            img.onload=()=>resolve(img);
            img.src=e.target.result;
        };
        reader.readAsDataURL(file);
    });
}