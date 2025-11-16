//检查字符串是否为纯数字字符串
export function isPureString(str: string): boolean {

  if(typeof str!=="string"||str===""){
      return false;
  }
 for(const char of str){
     if(char<'0'||char>'9'){
         return false;
     }
 }
 return true;
}