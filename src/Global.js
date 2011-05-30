

///	<summary>
///		Returns the global object
///	</summary>
///	<returns global object />
function getGlobal(){
	return (function(){
		return this;
	}).call(null);
}
