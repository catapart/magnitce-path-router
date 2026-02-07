// add any setup code here;
// initialize frameworks, register custom elements, anything you may need to do before running tests

import '../path-router';

if(document.readyState == 'loading')
{
    document.addEventListener('DOMContentLoaded', init);
}
else
{
    init();
}

async function init()
{
    console.log('hello world');
}