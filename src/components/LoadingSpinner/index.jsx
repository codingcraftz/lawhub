import "./index.css";

const LoadingSpinner = () => {
  return (
    <div className="flex w-screen h-screen justify-center items-center bg-black-50 opacity-80">
      <div class="lds-spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};
export default LoadingSpinner;
