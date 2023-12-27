// password visibility toggle
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.eye').forEach(function (element) {
    element.addEventListener('click', function () {
      document.querySelector('#password').setAttribute('type', 'text');
      document.querySelector('#confirm-password').setAttribute('type', 'text');
      document.querySelectorAll('.eye').forEach(function (eye) {
        eye.style.display = 'none';
      });
      document.querySelectorAll('.eye-slash').forEach(function (eyeSlash) {
        eyeSlash.style.display = 'block';
      });
    });
  });

  document.querySelectorAll('.eye-slash').forEach(function (element) {
    element.addEventListener('click', function () {
      document.querySelector('#password').setAttribute('type', 'password');
      document
        .querySelector('#confirm-password')
        .setAttribute('type', 'password');
      document.querySelectorAll('.eye-slash').forEach(function (eyeSlash) {
        eyeSlash.style.display = 'none';
      });
      document.querySelectorAll('.eye').forEach(function (eye) {
        eye.style.display = 'block';
      });
    });
  });
});

// submit button function
document.addEventListener('DOMContentLoaded', function () {
  // This function will run when the DOM is ready
  var submitButton = document.getElementById('submit');

  if (submitButton) {
    submitButton.addEventListener('click', validateAndRedirect);
  } else {
    console.error('The \'submit\' button element is not found in the document.');
  }

  function validateAndRedirect() {
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm-password').value;
    var error = document.querySelector('.error');
    var regex = /(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // Throw an error if these conditions aren't met
    if (password !== confirmPassword) {
      error.innerHTML =
        '<span class=\'font-medium\'>Matte Kudasai!</span> Your passwords are like apples and oranges – Please make sure they match!';
      error.style.display = 'block'; document.getElementById('hide').style.display = 'none';
    } else if (!regex.test(password) || !regex.test(confirmPassword)) {
      error.innerHTML =
        '<span class=\'font-medium\'>Try a combo stronger than Goku!</span> Password must be at least 8 characters long, include at least one capital letter, number, and symbol.';
      error.style.display = 'block'; document.getElementById('hide').style.display = 'none';
    } else {
      error.style.display = 'none';

      // Store Passwords
      (async () => {

        const { updatePassword } = await import('./util.ts');
        try {
          var hash = await updatePassword(password);
          console.log(`hash: ${hash}`);
          // Link to next page
          //window.location.replace('/project.html');
        }
        catch (err) {
          error.innerHTML = '<span class=\'font-medium\'>Matte Kudasai!</span> could not set password';
          error.style.display = 'block';
        }
      })();
    }
  }
});
