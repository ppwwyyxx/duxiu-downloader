// By Michael Chaney, Michael Chaney Consulting Corporation
// Copyright 2005, Michael Chaney Consulting Corporation
// All rights not explicitly granted to you are reserved to the
// copyright holder.
//
// Released under terms of any of the following standard licenses:
// 1. BSD (sans advertising clause)
// 2. MIT
// 3. Apache
// 4. GPL v2 or GPL v3
//
// Implements a standard C99 sprintf function for use in JavaScript.
// Also includes the x$ constructs to allow parameter positions to be
// specified in the format string.  See below for formats that are
// specifically not implemented.  Please note that the unimplemented
// formats will throw errors (configurable).
//
// This understands the following constructs:
// %% - makes a percent sign
// * - use a param for width/precision
//   sprintf("%*d", width, num);
// %x$ - use param at position x for value to format
// *x$ - use param at position x for width or precision
//   sprintf("%2$*1$d", width, num);
// Note that if you use the x$ syntax, it must be used everywhere.
// Additionally, the parameters used for width or precision must be integers.
//
// Flags:
// # - alternate form (prepend "0" for octal "o", "0x" for hex "x" or "X",
//			always include the "." for floating formats
//		sprintf("%#x", 5) returns "0x5"
//		sprintf("%#f", 5) returns "5."
//		sprintf("%#o", 5) return "05"
//
// 0 - zero padding for numerics.  Note that "-" and a precision will
// 		take precedence and cause this to be ignored
//		sprintf("%03d", 5) returns "005"
//
// - - left justify the value within the width
//		sprintf("%-3d", 5) return "5  "
//
// ' ' (space) - put a blank before a positive number or empty string
//		sprintf("% d", 5) returns " 5"
//		sprintf("% d", -5) returns "-5"
//
// + - always put the sign for a numeric format
//		sprintf("%+d", 5) returns "+5"
//		sprintf("%+d", -5) returns "-5"
//
// ' - Show grouping for thousands - for signed conversions d, i, f, or g
//		sprintf("%'d", 5000000) returns "5,000,000"
//
// Format specification
//
// After the flags come the optional width & precision.  Either may be
// specified as "*" (use next param as value) or "*x$" (use param #x as
// value, based at "1" for first param).
//
// The "width" is the minimum field width.  The field will grow to
// accomodate larger data.
// The precision follows a "." after the width.  For integer
// formats, this is the minimum number of digits (0 padded on left).
// For floating point formats, this is the number of digits right of the
// decimal point.
// For string conversions, this is the maximum width of the string,
// further characters will be truncated.
//
// After width and precision come the conversion type:
//
// d, i - integer, precision defaults to "1".  If precision is "0", then
// 		"0" will show nothing.
// u - unsigned integer, identical to "d" otherwise.  This does not deal
//			appropriately with negative numbers, it just chops the sign off.
//		sprintf("%d", 5) returns "5"
//
// o - unsigned integer - octal format
//		sprintf("%o", 16) returns "20"
//
// x, X - hexadecimal, using either lowercase or uppercase a-f
//		sprintf("%x", 16) returns "10"
//		sprintf("%X", 31) returns "1F"
//
// f, F - floating pont output.  precision default is "6".  At least one
//			digit is always shown before the decimal point.  No decimal
//			point is shown if precision is "0", unless the alternate flag
//			is set
//		sprintf("%.2f", 5) returns "5.00"
//		sprintf("%.0f", 5.5) returns "6"
//
// e, E - Scientific notation - precision determines how many digits are
//			shown after the decimal point, one is shown before it.  The
//			exponent is shown as two digits.  The case of the "e" is
//			determine by the case of the format specifier.
//		sprintf("%5.4e", 5000) returns "5.0000e+03"
//		sprintf("%5.0e", 39483) returns "4e+04"
//		sprintf("%.5E", .005) returns "5.00000E-03"
//
// g, G - Use f or e (F/E).  Basically, if the number of digits is less
//			than the precision, use "f", otherwise use "e".  Precision
//			defaults to 6.  Put another way, if the exponent is greater
//			than or equal to the precision, or less than "-4", use "e",
//			otherwise, use "f".
//
// c - integer argument is taken to be an ordinal character position,
//			and a single character is output.  Internally uses
//			String.fromCharCode
//		sprintf("%c", 65) returns "A"
//
// s - string.  "width" is the minimum width given for the string, and
//			"precision is the maximum width.
//
//
// Specifically not implemented:
//
// "length" modifier - This doesn't really make sense in a weakly typed
// language like JavaScript.  These are "hh", "h", "l", "ll", "L", "q",
// "j", "z", "t".  They are simply ignored.
//
// Formats "a", "A", "C", "S", "P", and "n" are not implemented and will
// specifically throw an error.  Look below for
// throw_error_on_unimplemented_formats to change this.


function sprintf(format) {

	// set to true if you want the unimplemented formats to throw an error.
	// If set to false, they will put "(unimplemented format %x)" in the output,
	// where "x" is the format specifier
	var throw_error_on_unimplemented_formats=false;

	// true if using positional parameter specifications (i.e. %2$d)
	var using_positionals=undefined;
	// checklist to make sure all parameters are seen
	var positionals_seen=Array(arguments.length);
	// counter to move through list if not using specified params
	var position=1;
	// split will alternate between text and formats - arg! split doesn't
	// work properly in IE.  Incredible.  This is as incredible as Safari
	// not implementing Number.toFixed at all.
	//var eachitem=format.split(/(%.*?[diuoxXfFeEgGcsaACSPn%])/);
	var eachitem=new Array();
	var strpos=0, nformat=format;
	while (nformat) {
		if (nformat.charAt(0)=='%') {
			var myitem=nformat.match(/^%.*?[diuoxXfFeEgGcsaACSPn%]/)[0];
			eachitem.push(myitem);
			nformat=nformat.slice(myitem.length);
		} else {
			var nextpercent=nformat.indexOf('%');
			if (nextpercent>0) {
				eachitem.push(nformat.slice(0,nextpercent));
				nformat=nformat.slice(nextpercent);
			} else {
				eachitem.push(nformat);
				nformat='';
			}
		}
	}
	// string that we're building
	var retval='';

	// Object to hold flags
	function Flags(raw_flags) {
		if (!raw_flags) return;
		this.alternate=(raw_flags.indexOf('#')>-1);
		this.left_justify=(raw_flags.indexOf('-')>-1);
		this.zero_padding=(raw_flags.indexOf('0')>-1 && !this.left_justify);
		this.show_sign=(raw_flags.indexOf('+')>-1);
		this.sign_position=(raw_flags.indexOf(' ')>-1 && !this.show_sign);
		this.show_thousands=(raw_flags.indexOf("'")>-1);
	}

	Flags.prototype.toString = function () {
		return (this.alternate?'#':'')+(this.zero_padding?'0':'')+
				(this.left_justify?'-':'')+(this.sign_position?' ':'')+
				(this.show_sign?'+':'')+(this.show_thousands?"'":'');
	}

	function format_item(thisitem, flags, width, precision, length_modifier, conversion_specifier, value) {
		if (value===undefined) value='';
		switch (conversion_specifier) {
			case 'd':
			case 'i':
				return format_d(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'u':
				return format_d(thisitem, flags, width, precision, length_modifier, int_to_unsigned(value));
				break;
			case 'o':
				return format_o(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'x':
				return format_x(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'X':
				return format_x(thisitem, flags, width, precision, length_modifier, value, 'X');
				break;

			case 'f':
				return format_f(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'F':
				return format_f(thisitem, flags, width, precision, length_modifier, value, 'F');
				break;

			case 'e':
				return format_e(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'E':
				return format_e(thisitem, flags, width, precision, length_modifier, value, 'E');
				break;

			case 'g':
				return format_g(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'G':
				return format_g(thisitem, flags, width, precision, length_modifier, value, 'G');
				break;

			case 'c':
				return format_c(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 's':
				return format_s(thisitem, flags, width, precision, length_modifier, value);
				break;

			case 'a':
			case 'A':
			case 'C':
			case 'S':
			case 'P':
			case 'n':
				if (throw_error_on_unimplemented_formats) {
					// Throw an error if they try to use the unimplemented formats
					throw new Error("Unimplemented conversion specifier: "+conversion_specifier);
				} else {
					return sprintf("(unimplemented format %%%s)", conversion_specifier);
				}
				break;

			default:
				throw new Error("Unrecognized format specification: "+thisitem);
				break;
		}

		function blanks(n, sepchar) {
			var retval='';
			if (sepchar==undefined) sepchar=' ';
			while (n) {
				retval+=sepchar;
				n--;
			}
			return retval;
		}

		function final_padding(retval, min_width, flags) {
			if (min_width!=undefined) {
				if (retval.length<min_width) {
					if (flags.left_justify) {
						retval += blanks(min_width-retval.length);
					} else {
						retval = blanks(min_width-retval.length) + retval;
					}
				}
			}
			return retval;
		}

		function show_thousands(numstr) {
			if (numstr.length<4) {
				return numstr;
			} else {
				var retval=new Array();
				var firstpop=numstr.length%3;
				if (firstpop) {
					retval.push(numstr.slice(0,firstpop));
					numstr = numstr.slice(firstpop);
				}
				while (numstr.length) {
					retval.push(numstr.slice(0,3));
					numstr = numstr.slice(3);
				}
				return retval.join(',');
			}
		}

		// Creates an unsigned integer from an integer.  If the integer is
		// negative, and the absolute value is less than 2^31, we'll
		// perform a 2's complement function on it.  If it's greater than
		// 0, it is returned unchanged.  If it's negative but the absolute
		// value is over 2^31, we'll just return the first 32 bits.  There's
		// not much else we can do :(
		function int_to_unsigned(num) {
			if (num>0) return num;
			if (Math.abs(num)>=2147483648) return Math.abs(num);
			return (4294967296+num);
		}

		// for c, width is the minimum field width, and precision is
		// ignored.  Flags are zero_padding and left_justify.
		// Uses String.fromCharCode
		function format_c(thisitem, flags, min_width, precision, length_modifier, value) {
			if (typeof(value)!='number') {
				value=parseInt(value);
				if (isNaN(value)) {
					value='0';
					if (precision===0) return blanks(min_width);
				}
			}
			ourchar=String.fromCharCode(value);
			if (flags.zero_padding) {
				if (ourchar.length<min_width) {
					ourchar = blanks(min_width-ourchar.length,'0') + ourchar;
				}
			}
			return final_padding(ourchar, min_width, flags);
		}

		// for x or X, width is the minimum field width, and precision is the
		// minimum width for the number.  If precision exists and the
		// number is shorter than it when formatted, it'll be zero padded
		// in front.  Flags are zero_padding, left_justify, and alternate.
		// Uses Number.toString(16), which may have limitations.  The
		// "alternate" representation adds 1 to precision (if there is a
		// precision) and puts a leading "0" in.
		// Pass it garbage and it'll print 0.
		// Negative numbers will be printed as such.  In standard C, this
		// is not the case, as it's treated as an unsigned integer.
		function format_x(thisitem, flags, min_width, precision, length_modifier, value, type) {
			if (precision===0 && !value) return blanks(min_width);
			if (typeof(value)!='number') {
				value=parseInt(value);
				if (isNaN(value)) {
					value='0';
					if (precision===0) return blanks(min_width);
				}
			}
			value=int_to_unsigned(value);
			var ournum=value.toString(16);
			if (precision) {
				if (ournum.length<precision) {
					ournum = blanks(precision-ournum.length,'0') + ournum;
				}
			} else if (flags.zero_padding) {
				if (ournum.length<min_width) {
					ournum = blanks(min_width-ournum.length,'0') + ournum;
				}
			}
			if (type=='X') ournum=ournum.toUpperCase();
			if (flags.alternate) {
				ournum = '0x' + ournum;
			}

			return final_padding(ournum, min_width, flags);
		}

		// for o, width is the minimum field width, and precision is the
		// minimum width for the number.  If precision exists and the
		// number is shorter than it when formatted, it'll be zero padded
		// in front.  Flags are zero_padding, left_justify, and alternate.
		// Uses Number.toString(8), which may have limitations.  The
		// "alternate" representation adds 1 to precision (if there is a
		// precision) and puts a leading "0" in.
		// Pass it garbage and it'll print 0.
		// Negative numbers will be printed as such.  In standard C, this
		// is not the case, as it's treated as an unsigned integer.
		function format_o(thisitem, flags, min_width, precision, length_modifier, value) {
			if (precision===0 && !value) return blanks(min_width);
			if (typeof(value)!='number') {
				value=parseInt(value);
				if (isNaN(value)) {
					value='0';
					if (precision===0) return blanks(min_width);
				}
			}
			value=int_to_unsigned(value);
			var ournum=value.toString(8);
			if (precision) {
				if (ournum.length<precision) {
					ournum = blanks(precision-ournum.length,'0') + ournum;
				}
			} else if (flags.zero_padding) {
				if (ournum.length<min_width) {
					ournum = blanks(min_width-ournum.length,'0') + ournum;
				}
			}
			if (flags.alternate && ournum.charAt(0)!='0') {
				ournum = '0' + ournum;
			}

			return final_padding(ournum, min_width, flags);
		}

		// for d/i, width is the minimum field width, and precision is the
		// minimum width for the number.  If precision exists and the
		// number is shorter than it when formatted, it'll be zero padded
		// in front.  Flags are zero_padding, left_justify, sign_position,
		// show_sign, and show_thousands.
		// Uses Number.toFixed, so really large integers (>=1e+21) will
		// print in exponential notation, which will likely cause problems.
		// I would worry about this, but let's be frank, %d originally
		// only printed up to 2^32, so this shouldn't be a big deal.
		// Pass it garbage and it'll print 0.
		function format_d(thisitem, flags, min_width, precision, length_modifier, value) {
			if (precision===0 && !value) return blanks(min_width);
			if (typeof(value)!='number') {
				value=parseFloat(value);
				if (isNaN(value)) {
					value='0';
					if (precision===0) return blanks(min_width);
				}
			}
			var ournum=value.toFixed(0);
			var sign='';
			if (ournum.slice(0,1)=='-') {
				sign='-';
				ournum = ournum.slice(1);
			}
			if (flags.show_sign) {
				if (sign=='') sign='+';
			} else if (flags.sign_position) {
				if (sign=='') sign=' ';
			}
			if (precision) {
				if (ournum.length+sign.length<precision) {
					ournum = blanks(precision-ournum.length-sign.length,'0') + ournum;
				}
			} else if (flags.zero_padding) {
				if (ournum.length+sign.length<min_width) {
					ournum = blanks(min_width-ournum.length-sign.length,'0') + ournum;
				}
			}

			if (flags.show_thousands) {
				ournum=show_thousands(ournum);
			}

			return final_padding(sign+ournum, min_width, flags);
		}

		// for e/E, width is the minimum field width, and precision is the
		// number of digits after the decimal place (default 6).
		// Flags are zero_padding, left_justify, sign_position,
		// show_sign, and alternate.
		// Uses Number.toExponential, you might want to figure out if that's
		// going to cause you problems.  It won't for normal numbers.
		// Pass it garbage and it'll print 0.
		function format_e(thisitem, flags, min_width, precision, length_modifier, value, type) {
			if (typeof(value)!='number') {
				value=parseFloat(value);
				if (isNaN(value)) value='0';
			}
			if (precision===undefined) precision=6;
			var ournum=value.toExponential(precision);
			var sign, intpart, fractpart, expsign, exppart;
			if (pieces=ournum.match(/^(-)?(\d*)(?:\.(\d*))?e(\+|-)(\d+)$/)) {
				sign=pieces[1];
				intpart=pieces[2];
				fractpart=pieces[3];
				expsign=pieces[4];
				exppart=pieces[5];
			} else {
				//alert("Uhoh: "+ournum);
				throw new Error("I'm confused about an exponential: "+ournum);
			}
			if (exppart.length==1) exppart='0'+exppart;
			if (fractpart===undefined) fractpart='';
			if (flags.show_sign) {
				if (sign=='') sign='+';
			} else if (flags.sign_position) {
				if (sign=='') sign=' ';
			} else if (sign==undefined) {
				sign='';
			}
			if ((type=='g' || type=='G') && !flags.alternate) {
				fractpart = fractpart.replace(/0+$/,'');
			}
			if (flags.zero_padding) {
				var mywidth=sign.length+intpart.length+(fractpart.length||flags.alternate?1:0)+fractpart.length+2+exppart.length;
				if (mywidth<min_width) {
					intpart = blanks(min_width-mywidth,'0') + intpart;
				}
			}

			var echar='e';
			if (type=='E' || type=='G') echar='E';
			if (precision==0 || fractpart.length==0) {
				ournum=sign+intpart+(flags.alternate?'.':'')+echar+expsign+exppart;
			} else {
				ournum=sign+intpart+'.'+fractpart+echar+expsign+exppart;
			}

			return final_padding(ournum, min_width, flags);
		}

		// for f/F, width is the minimum field width, and precision is the
		// number of digits after the decimal place (default 6).
		// Flags are zero_padding, left_justify, sign_position,
		// show_sign, show_thousands, and alternate.
		// Uses Number.toFixed, you might want to figure out if that's
		// going to cause you problems.  It won't for normal numbers.
		// Pass it garbage and it'll print 0.
		function format_f(thisitem, flags, min_width, precision, length_modifier, value, type) {
			if (typeof(value)!='number') {
				value=parseFloat(value);
				if (isNaN(value)) value='0';
			}
			if (precision===undefined) precision=6;
			var ournum
			if (type=='g' || type=='G') {
				ournum=value.toPrecision(precision);
			} else {
				ournum=value.toFixed(precision);
			}
			var sign, intpart, fractpart;
			if (pieces=ournum.match(/^(-)?(\d*)(?:\.(\d*))?$/)) {
				sign=pieces[1];
				intpart=pieces[2];
				fractpart=pieces[3];
			} else {
				//alert("Uhoh: "+ournum);
				throw new Error("Your number \""+ournum+"\" is too big for our %f representation.  It looks like toFixed has used exponential notation.");
			}
			if (fractpart===undefined) fractpart='';
			if (flags.show_sign) {
				if (sign=='') sign='+';
			} else if (flags.sign_position) {
				if (sign=='') sign=' ';
			} else if (sign==undefined) {
				sign='';
			}
			if ((type=='g' || type=='G') && !flags.alternate) {
				fractpart = fractpart.replace(/0+$/,'');
			}
			if (flags.zero_padding) {
				var mywidth=sign.length+intpart.length+(fractpart.length||flags.alternate?1:0)+fractpart.length
				if (mywidth<min_width) {
					intpart = blanks(min_width-mywidth,'0') + intpart;
				}
			}

			if (flags.show_thousands) {
				intpart=show_thousands(intpart);
			}

			if (precision==0) {
				ournum=sign+intpart+(flags.alternate?'.':'');
			} else if (type=='f' || type=='F' || fractpart.length || flags.alternate) {
				ournum=sign+intpart+'.'+fractpart;
			} else {
				ournum=sign+intpart;
			}

			return final_padding(ournum, min_width, flags);
		}

		// for g/G, width is the minimum field width, and precision is the
		// number of significant digits, default 6.  precision "0" will be
		// changed to "1".  The decimal point isn't shown unless the
		// precision is >1 and there are non-zero digits after it.
		// Trailing 0's after the decimal point are removed unless
		// flags.alternate is set.
		// Flags are zero_padding, left_justify, sign_position,
		// show_sign, and alternate.
		// Pass it garbage and it'll print 0.
		function format_g(thisitem, flags, min_width, precision, length_modifier, value, type) {
			if (!type) type='g';
			if (typeof(value)!='number') {
				value=parseFloat(value);
				if (isNaN(value)) value='0';
			}
			if (precision===undefined) precision=6;
			if (precision==0) precision=1;
			if (value>=.0001 && value<Math.pow(10,precision)) {
				return format_f(thisitem, flags, min_width, precision, value, type);
			} else {
				return format_e(thisitem, flags, min_width, precision-1, value, type);
			}
		}

		// for s, width is the minimum width, and precision is the maximum
		// width.  The only flag that we pay attention to is "left_justify".
		function format_s(thisitem, flags, min_width, max_width, length_modifier, value) {
			var retval=value.toString();
			if (max_width!=undefined && retval.length>max_width) {
				retval = retval.slice(0,max_width);
			}
			return final_padding(retval, min_width, flags);
		}
	}

	// simple loop - if it's %%, show %, if it doesn't start with %, show
	// the text, if it starts with %, parse the format and apply it to
	// its arguments.
	for (var i=0 ; i<eachitem.length ; i++) {
		var thisitem=eachitem[i];
		if (thisitem.charAt(0)=='%') {
			if (thisitem == '%%') {
				retval += '%';
				if (false) alert("Text: %\n");
			} else if (pieces=thisitem.match(/^%(?:(\d+)\$)?([#0 +'\-]*)(?:(?:\*(\d+)\$)|(\*)|(\d+))?(\.(?:(?:\*(\d+)\$)|(\*)|(?:-?(\d+)))?)?(hh|h|ll|l|L|q|j|z|t)?([%diuoxXfFeEgGcsaACSPn])/)) {
				// pieces array is:
				//		1	positional argument # for value
				//		2	flags
				//		3	width ("x" from positional specification (*x$))
				//		4	width (*)
				//		5	width (digits)
				//		6	precision exists
				//		7	precision ("x" from positional specification (*x$))
				//		8	precision (*)
				//		9	precision (digits)
				//		10	argument length modifier (ignored)
				//		11	conversion specifier
				// Need this for Safari
				for (var j in pieces) { if (pieces[j]==='') pieces[j]=undefined; }
				var flags=new Flags(pieces[2]);
				var value_positional=pieces[1];
				var width_positional=pieces[3];
				var precision_positional=pieces[7];
				var width=pieces[5];
				var width_next_arg=pieces[4]?true:false;
				var precision=pieces[9];
				var precision_next_arg=pieces[8]?true:false;
				var has_precision=pieces[6]?true:false;
				var length_modifier=pieces[10];		// ignored
				var conversion_specifier=pieces[11];
				var value;

				// If has_precision is true, but there's no precision or
				// it's negative, it will be 0.
				// If there is a precision, that's what we'll use.
				if (has_precision && !precision_next_arg && (precision==undefined || precision<0)) {
					precision=0;
				}

				if (false)
				alert("Raw Info\nItem: "+thisitem+
						"\nFlags: "+flags.toString()+
						"\nValue Position: "+value_positional+
						"\nWidth Position: "+width_positional+
						"\nPrecision Position: "+precision_positional+
						"\nWidth: "+width+
						"\nUse Next Arg For Width: "+width_next_arg+
						"\nHas Precision: "+has_precision+
						"\nPrecision: "+precision+
						"\nUse Next Arg For Precision: "+precision_next_arg+
						"\nLength Modifier: "+length_modifier+
						"\nConversion Specifier: "+conversion_specifier);

				// Now, if they're using a positional for the value, then
				// they must use positionals for *all* values.  Also, they
				// must consume all parameters in that case.  So, we'll
				// check to make sure that they are or aren't using
				// positionals everywhere, and we'll set a flag in an array
				// to keep track of what's been used.
				if (using_positionals==undefined) {
					// first time here, set it up
					using_positionals=(value_positional?true:false);
				} else {
					if ((using_positionals &&
							(!value_positional || width_next_arg || precision_next_arg))
							|| (!using_positionals && value_positional)){
						throw new Error("You may not mix positional arguments with non-positional arguments in a format string");
					}
				}

				// Set the flags, get the values for specified positional
				// parameters
				if (using_positionals) {
					if (width_positional) {
						if (width_positional>=arguments.length) {
							throw new Error("Parameter positional specification is past end of argument list at "+thisitem+" (width specification: "+width_positional+")");
						}
						positionals_seen[width_positional]=true;
						width=arguments[width_positional];
					}
					if (precision_positional) {
						if (precision_positional>=arguments.length) {
							throw new Error("Parameter positional specification is past end of argument list at "+thisitem+" (precision specification: "+precision_positional+")");
						}
						positionals_seen[precision_positional]=true;
						precision=arguments[precision_positional];
					}
					if (value_positional>=arguments.length) {
						throw new Error("Parameter positional specification is past end of argument list at "+thisitem+" (value specification: "+value_positional+")");
					}
					positionals_seen[value_positional]=true;
					value=arguments[value_positional];

				// If not using specified positional params, we'll need to
				// pop the next params from the arguments list
				} else {
					if (width_next_arg) {
						if (position>=arguments.length) {
							throw new Error("Not enough parameters to fill format specifiers at "+thisitem+" (width specification)");
						}
						width=arguments[position++];
					}
					if (precision_next_arg) {
						if (position>=arguments.length) {
							throw new Error("Not enough parameters to fill format specifiers at "+thisitem+" (precision specification)");
						}
						precision=arguments[position++];
					}
					if (position>=arguments.length) {
						throw new Error("Not enough parameters to fill format specifiers at "+thisitem+" (value specification)");
					}
					value=arguments[position++];
				}

				if (false)
				alert("Item: "+thisitem+
						"\nFlags: "+flags.toString()+
						"\nWidth: "+width+
						"\nPrecision: "+precision+
						"\nLength Modifier: "+length_modifier+
						"\nConversion Specifier: "+conversion_specifier+
						"\nValue: "+value);

				retval += format_item(thisitem, flags, width, precision, length_modifier, conversion_specifier, value);
			} else {
				throw new Error("Invalid format specification: "+thisitem);
			}
		} else {
			retval += thisitem;
			if (false) alert("Text: "+thisitem+"\n");
		}
	}

	// Make sure they're all used.  This is anal, but will probably catch
	// a lot of dumb mistakes if left on.
	if (using_positionals) {
		var unused_items = new Array();
		for (i=1 ; i<positionals_seen.length ; i++) {
			if (!positionals_seen[i]) {
				unused_items.push(i);
			}
		}
		if (unused_items.length>0) {
			throw new Error("Parameter positions were specified, but some parameters ("+unused_items.join(', ')+") weren't used");
		}
	} else if (position<arguments.length) {
		throw new Error("There were "+(arguments.length-1)+" parameters passed to sprintf, but only "+(position-1)+" parameters were used.");
	}

	return retval;
}

module.exports = sprintf;
