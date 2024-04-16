import React, {Component} from "react";

class CustomErrorBoundary extends Component {
    constructor (props){
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(error){
        return {hasError: true};
    }

    componentDidCatch(error, errorInfo) {
        console.error ('Error caught by CustomErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError){
            return (
                <div>
                    <h2>Something went wrong.</h2>
                    <p>Please try again later.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

export default CustomErrorBoundary;