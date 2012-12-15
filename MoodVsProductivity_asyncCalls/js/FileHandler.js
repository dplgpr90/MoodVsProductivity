// Class FileHandler
function FileHandler(){
  var documentationFileTypes = ['txt', 'odt', 'odp', 'ods', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'md', 'lwp', 'ps', 'tex', 'latex', 'rtf', 'cwk', 'ppt', 'lit', 'prz', 'sam', 'sdc', 'sdd', 'sdw', 'wpd'];

  this.isDocumentationFile = function (type) {
    return ($.inArray(type, documentationFileTypes)) != -1;
  }
}